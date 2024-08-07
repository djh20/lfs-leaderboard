import EventEmitter from "events";
import { Socket } from "net";
import { isAsciiChar, stringToBuffer } from "../utils/string";
import logger from "../utils/logger";
import { InSimBfnPacketType, InSimMessageSound, InSimPacketType, InSimPenaltyReason, InSimTinyPacketType } from "./packet";
import { db } from "../database";
import { createLeaderboard } from "./leaderboard";
import { updateVehicleModInfo } from "./vehicle";

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

  private ignoreLap: boolean = false;
  private watchingReplay: boolean = false;
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

    this.socket.setTimeout(2000, () => this.socket?.destroy());
    this.socket.connect({
      host: this.definition.host,
      port: this.definition.port || 29999
    });
  }

  public async updateLeaderboards() {
    if (!this.socket) return;
    if (!this.racing) return;
    if (!this.vehicleCode) return;
    if (!this.trackCode) return;
    if (!this.playerName) return;
    
    // Fetch all laps on the same track from database.
    const trackLaps = await db.lap.findMany({
      where: {
        trackCode: this.trackCode
      },
      orderBy: {
        timeMs: "asc"
      }
    });

    // Additionally filter laps that were in the same vehicle.
    const sameVehicleTrackLaps = trackLaps.filter(lap => 
      lap.vehicleCode == this.vehicleCode
    );
    
    const leaderboardOneInfo = await createLeaderboard(this.socket, {
      title: "Fastest Laps (Same Car)",
      slots: 3,
      laps: sameVehicleTrackLaps,
      showVehicle: false,
      playerToHighlight: this.playerName
    });

    const leaderboardTwoInfo = await createLeaderboard(this.socket, {
      title: "Fastest Laps (All Cars)",
      slots: 5,
      laps: trackLaps,
      yOffset: leaderboardOneInfo.height + 2,
      firstButtonId: leaderboardOneInfo.nextButtonId,
      showVehicle: true,
      playerToHighlight: this.playerName
    });
  }

  public sendMessage(msg: string) {
    this.socket?.write(
      Buffer.from([
        33,
        InSimPacketType.ISP_MSL,
        InSimMessageSound.SND_SYSMESSAGE,
        2,
        ...stringToBuffer(msg, 128)
      ])
    );
  }

  private reconnect() {
    // Don't reconnect if already connecting.
    if (this.socket?.connecting) return;

    // Destroy the old socket.
    this.socket?.destroy();
    this.socket = undefined;

    // Connect in 1 second.
    setTimeout(() => this.connect(), 1000);
  }

  private onConnect() {
    logger.info(`Connected to ${this.definition.host}`);
    this.socket?.setTimeout(0);

    // Send init packet to initialize the InSim system.
    this.socket?.write(
      Buffer.from([
        11, // Size (/4) (11 * 4 = 44 bytes)
        InSimPacketType.ISP_ISI, // Type (ISP_ISI)
        0, // ReqI (If non-zero LFS will send an IS_VER packet)
        0, // Zero

        0, 0, // Port for UDP replies from LFS (0 to 65535)
        4, 0, // Bit flags for options

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

          this.playerId = playerId;
          this.playerName = playerName;
          this.ignoreLap = false;

          // Determine if vehicle is official or modded.
          const vehicleIsOfficial = vehicleId.every(c => isAsciiChar(c));

          if (vehicleIsOfficial) {
            // Official
            this.vehicleCode = String.fromCharCode(...vehicleId).replace(/\0/g, '');

          } else { 
            // Mod
            this.vehicleCode = vehicleId.reverse().map(v => {
              let hex = v.toString(16).toUpperCase();
              if (hex.length == 1) hex = "0" + hex;
              return hex;
            }).join("");

            updateVehicleModInfo(this.vehicleCode);
          }

          logger.info(`${playerName} selected vehicle: ${this.vehicleCode}`);
          this.updateLeaderboards();
        }
      
      } else if (packetType == InSimPacketType.ISP_CPR) { // Player rename
        const playerName = String.fromCharCode(...packet.slice(4, 28)).replace(/\0/g, '');
        logger.info(`${this.playerName} changed their name to ${playerName}`);

        this.playerName = playerName;
        
      } else if (packetType == InSimPacketType.ISP_RST) { // Race start
        const trackCode = String.fromCharCode(...packet.slice(8, 14)).replace(/\0/g, '');
        logger.info(`${this.playerName} is on track: ${trackCode}`);
        this.trackCode = trackCode;
        this.racing = true;
        this.ignoreLap = false;
        this.updateLeaderboards();

      } else if (packetType == InSimPacketType.ISP_LAP) { // Lap completed
        const playerId = packet[3];
        if (playerId == this.playerId && !this.watchingReplay) {
          if (this.ignoreLap) {
            this.sendMessage("Lap ignored due to false start");
            this.ignoreLap = false;

          } else {
            const lapTimeData = Uint8Array.from(packet.slice(4, 8)).buffer;
            const lapTimeMs = new Uint32Array(lapTimeData)[0];

            // Lap time must be below 1 hour to be considered valid. The main reason for
            // this is that the game reports a lap time of 1 hour when exiting the pits
            // on practice mode. Futhermore, the formatLapTime function doesn't correctly
            // display times above 1 hour.
            if (lapTimeMs < 1000 * 60 * 60) {
              this.emit("lap", lapTimeMs);
            }
          }
        }

      } else if (packetType == InSimPacketType.ISP_STA) {
        this.watchingReplay = (packet[8] & 0x02) > 0;
      
      } else if (packetType == InSimPacketType.ISP_BFN) { // Buttons request
        const bfnPacketType: InSimBfnPacketType = packet[3];

        if (bfnPacketType == InSimBfnPacketType.BFN_REQUEST) { // Receive request (SHIFT+B)
          // Send leaderboards to client.
          this.updateLeaderboards();
        }

      } else if (packetType == InSimPacketType.ISP_PEN) { // Penalty
        const playerId = packet[3];
        const oldPen = packet[4];
        const reason = packet[6];

        if (playerId == this.playerId && 
          oldPen == 0 && 
          reason == InSimPenaltyReason.PENR_FALSE_START
        ) {
          this.ignoreLap = true;
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
          this.ignoreLap = false;
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
