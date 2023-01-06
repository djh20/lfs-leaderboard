import EventEmitter from "events";
import { Socket } from "net";
import { isAsciiChar, stringToBuffer } from "../utils/string";
import logger from "../utils/logger";
import { InSimPacketType, InSimTinyPacketType } from "./packet";
import { db } from "../database";
import moment from "moment";

export declare interface InSimClient {
  on(event: "lap", listener: (lapTimeMs: number) => void): this;
}

/**
 * The client class for InSim. Handles most logic, including connecting/reconnecting,
 * sending/receiving data, and updating the leaderboard.
 */
export class InSimClient extends EventEmitter {
  public definition: InSimClientDefinition;

  public playerId?: number;
  public playerName?: string;
  public vehicleCode?: string;
  public trackCode?: string;
  public racing: boolean = false;

  private socket?: Socket;
  
  /**
   * Temporarily holds data coming in from the socket. This is because some packets may
   * span over multiple TCP messages (or parts of multiple packets may arrive in a single
   * message).
   */
  private dataBuffer: number[] = [];

  constructor(definition: InSimClientDefinition) {
    super();
    this.definition = definition;
  }

  public connect() {
    if (this.socket) return;
    
    // Create a new socket for this connection attempt.
    this.socket = new Socket();

    // Bind events.
    this.socket.on("connect", this.onConnect.bind(this));
    this.socket.on("data", this.onData.bind(this));
    this.socket.on("error", this.onError.bind(this));
    this.socket.on("close", this.onClose.bind(this));

    this.socket.connect({
      host: this.definition.host,
      port: this.definition.port || 29999
    });
  }

  public async updateLeaderboard() {
    if (!this.racing) return;
    if (!this.vehicleCode) return;
    if (!this.trackCode) return;

    const slots = 5;
    const slotHeight = 7;

    /**
     * The horizontal margin around each slot.
     */
    const slotMargin = 1;
    
    // Fetch relevent laps from database.
    const laps = await db.lap.findMany({
      where: {
        vehicleCode: this.vehicleCode,
        trackCode: this.trackCode
      },
      orderBy: {
        timeMs: "asc"
      },
      take: slots
    });

    // We should never exceed 99 characters (1 null character).
    const maxTextLength = 100;
    
    // Title
    this.socket?.write(
      Buffer.from([
        3 + (maxTextLength/4), // 3 + TEXT_SIZE/4
        InSimPacketType.ISP_BTN,
        1, // non-zero (returned in IS_BTC and IS_BTT packets)
        0, // connection to display the button (0 = local / 255 = all)

        0, // button ID (0 to 239)
        0, // Flags
        0x41, // Button Style
        0,

        2,
        20,
        30,
        10,

        ...stringToBuffer("Lap Leaderboard", maxTextLength)
      ])
    );
    
    // Background
    this.socket?.write(
      Buffer.from([
        3 + (maxTextLength/4), // 3 + TEXT_SIZE/4
        InSimPacketType.ISP_BTN,
        1, // non-zero (returned in IS_BTC and IS_BTT packets)
        0, // connection to display the button (0 = local / 255 = all)

        1, // button ID (0 to 239)
        0, // Flags
        32, // Button Style
        0,

        2,
        20,
        30,
        10+(slots*slotHeight)+2, // Calculate height depending on number of slots.

        ...Buffer.alloc(maxTextLength)
      ])
    );
    
    // Create a button for each slot.
    for (let i = 0; i < slots; i++) {
      let text = `${i+1}. `;

      if (i < laps.length) {
        const lap = laps[i];
        const timeStr = moment(lap.timeMs).format("m:ss.SS");
        text += `${lap.playerName}  ${timeStr}`;
      } else {
        text += "----  ----"
      }
      
      this.socket?.write(
        Buffer.from([
          3 + (maxTextLength/4), // 3 + TEXT_SIZE/4
          InSimPacketType.ISP_BTN,
          1, // non-zero (returned in IS_BTC and IS_BTT packets)
          0, // connection to display the button (0 = local / 255 = all)

          i+2, // button ID (0 to 239)
          0, // Flags
          99, // Button Style
          0,

          2+slotMargin,
          30+(i*slotHeight),
          30-(slotMargin*2),
          slotHeight,

          ...stringToBuffer(text, maxTextLength)
        ])
      );
    }
  }

  private reconnect() {
    // Don't reconnect if already connecting.
    if (this.socket?.connecting) return;

    // Destroy the old socket.
    this.socket?.destroy();
    this.socket = undefined;

    // Connect in 2 seconds.
    setTimeout(() => this.connect(), 2000);
  }

  private onConnect() {
    logger.info(`Connected to ${this.definition.host}`);

    // Send init packet to initialize the InSim system.
    this.socket?.write(
      Buffer.from([
        11, // Size (/4) (11 * 4 = 44 bytes)
        InSimPacketType.ISP_ISI, // Type (ISP_ISI)
        0, // ReqI (If non-zero LFS will send an IS_VER packet)
        0, // Zero

        0, 0, // Port for UDP replies from LFS (0 to 65535)
        0, 0, // Bit flags for options

        9, // The INSIM_VERSION used by your program
        0, // Special host message prefix character
        0, 0, // Time in ms between NLP or MCI (0 = none)
        
        ...stringToBuffer(this.definition.password || "", 16), // Admin password (if set in LFS)
        ...stringToBuffer("LFS Leaderboard", 16) // A short name for your program
      ])
    );
  }

  private onData(data: Buffer) {
    // Add new data to buffer.
    this.dataBuffer.push(...data);

    // Keep looping until we run out of data (or until loop broken).
    while (this.dataBuffer.length > 0) {
      // Calculate packet size (LFS divides by 4).
      const packetSize = (this.dataBuffer[0] * 4);

      // If we haven't received the full packet, break the loop and wait for more data.
      if (this.dataBuffer.length < packetSize) break;

      // Take packet out of buffer.
      const packet = this.dataBuffer.splice(0, packetSize);
      const packetType: InSimPacketType = packet[1];
      
      if (packetType == InSimPacketType.ISP_NPL) { // Player join
        const playerTypeByte = packet[5];
        const isAi = ((playerTypeByte >> 1) & 0x01) == 1;
        const isRemote = ((playerTypeByte >> 2) & 0x01) == 1;
        const isLocalPlayer = !isAi && !isRemote;

        // Only process data if it's the local player.
        if (isLocalPlayer) {
          const playerId = packet[3];

          // Use .replace to get rid of any null characters.
          const playerName = String.fromCharCode(...packet.slice(8, 32)).replace(/\0/g, '');
          const vehicleId = packet.slice(40, 43);

          let vehicleCode = "";

          // Determine if vehicle is official or modded.
          if (vehicleId.every(c => isAsciiChar(c))) {
            // Official
            vehicleCode = String.fromCharCode(...vehicleId).replace(/\0/g, '');

          } else { 
            // Mod
            vehicleCode = vehicleId.reverse().map(v => {
              let hex = v.toString(16).toUpperCase();
              if (hex.length == 1) hex = "0" + hex;
              return hex;
            }).join("");
          }

          logger.info(`${playerName} selected vehicle: ${vehicleCode}`);
          this.playerId = playerId;
          this.playerName = playerName;
          this.vehicleCode = vehicleCode;
          this.updateLeaderboard();
        }
      } else if (packetType == InSimPacketType.ISP_RST) { // Race start
        const trackCode = String.fromCharCode(...packet.slice(8, 14)).replace(/\0/g, '');
        logger.info(`${this.playerName} is on track: ${trackCode}`);
        this.trackCode = trackCode;
        this.racing = true;
        this.updateLeaderboard();

      } else if (packetType == InSimPacketType.ISP_LAP) { // Lap completed
        const playerId = packet[3];
        if (playerId == this.playerId) {
          const lapTimeData = Uint8Array.from(packet.slice(4, 8)).buffer;
          const lapTimeMs = new Uint32Array(lapTimeData)[0];
          const lapTimeSeconds = lapTimeMs/1000;

          logger.info(`${this.playerName} got a lap time of ${lapTimeSeconds}s`);
          this.emit("lap", lapTimeMs);
        }

      } else if (packetType == InSimPacketType.ISP_TINY) {
        const tinyPacketType: InSimTinyPacketType = packet[3];

        if (tinyPacketType == InSimTinyPacketType.TINY_NONE) { // Keep alive
          // LFS will send a blank IS_TINY packet like this every 30 seconds.
          // If InSim does not receive a packet for 70 seconds, it will close the socket.

          // Respond with an identical packet to keep the connection alive.
          this.socket?.write(Buffer.from(packet));

        } else if (tinyPacketType == InSimTinyPacketType.TINY_REN) { // Race end
          // Clear all buttons
          this.racing = false;
          this.socket?.write(
            Buffer.from([
              2,
              InSimPacketType.ISP_BFN,
              0,
              1, // BFN_CLEAR (clear all buttons made by this insim instance)

              0, // Local (0 = local / 255 = all)
              0,
              0,
              0
            ])
          );
        }
      }
    }
  }

  private onError(err: string) {
    this.reconnect();
  }

  private onClose() {
    this.reconnect();
  }
}

export interface InSimClientDefinition {
  host: string;
  port?: number;
  password?: string;
}
