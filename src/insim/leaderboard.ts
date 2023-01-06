import { Lap } from "@prisma/client";
import moment from "moment";
import { Socket } from "net";
import { stringToBuffer } from "../utils/string";
import { InSimPacketType } from "./packet";
import { getVehicleName } from "./vehicle";

// We should never exceed 99 characters (1 null character).
const maxTextLength = 100;

interface LeaderboardOptions {
  title: string;
  slots: number;
  laps: Lap[];
  yOffset?: number;
  firstButtonId?: number;
  showVehicle: boolean;
}

interface LeaderboardInfo {
  height: number;
  nextButtonId: number;
}

export async function createLeaderboard(socket: Socket, options: LeaderboardOptions): Promise<LeaderboardInfo> {
  const slotHeight = options.showVehicle ? 10 : 8;

  /**
   * The horizontal margin around each slot.
   */
  const slotMargin = 1;

  const totalHeight = 10+(options.slots*slotHeight)+2; // Calculate height depending on number of slots.
  const yOffset = options.yOffset || 0;

  let nextButtonId = options.firstButtonId || 0;
  
  // Background
  socket.write(
    createButton({
      id: nextButtonId++,
      style: 32,
      x: 2,
      y: 18 + yOffset,
      width: 30,
      height: totalHeight
    })
  );

  // Title
  socket.write(
    createButton({
      id: nextButtonId++,
      text: options.title,
      style: 65,
      x: 2,
      y: 18 + yOffset,
      width: 30,
      height: 10
    })
  );
  
  // Create a tile for each slot.
  for (let i = 0; i < options.slots; i++) {
    const slotX = 2 + slotMargin;
    const slotY = 18 + 10 + yOffset + (i*slotHeight);
    const slotWidth = 30 - (slotMargin*2);
    
    // Background
    socket.write(
      createButton({
        id: nextButtonId++,
        style: 32,
        x: slotX,
        y: slotY,
        width: slotWidth,
        height: slotHeight
      })
    );
    
    if (i >= options.laps.length) continue;

    const lap = options.laps[i];
    const playerText = `${i+1}. ${lap.playerName}`;
    const timeText = moment(lap.timeMs).format("m:ss.SS");

    // Player name
    socket.write(
      createButton({
        id: nextButtonId++,
        text: playerText,
        style: 64 + 3,
        x: slotX,
        y: slotY + 1,
        width: slotWidth,
        height: 6
      })
    );

    // Time
    socket.write(
      createButton({
        id: nextButtonId++,
        text: timeText,
        style: 128 + 3,
        x: slotX,
        y: slotY + 1,
        width: slotWidth,
        height: 6
      })
    );
    
    if (options.showVehicle) {
      // Vehicle
      socket.write(
        createButton({
          id: nextButtonId++,
          text: await getVehicleName(lap.vehicleCode),
          style: 64 + 3,
          x: slotX+1,
          y: slotY + (slotHeight - 4),
          width: slotWidth,
          height: 3
        })
      );
    }
  }

  return { 
    height: totalHeight, 
    nextButtonId 
  };
}

interface ButtonOptions {
  id: number;
  text?: string;
  style?: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function createButton(options: ButtonOptions) : Buffer {
  return Buffer.from([
    3 + (maxTextLength/4), // 3 + TEXT_SIZE/4
    InSimPacketType.ISP_BTN,
    1, // non-zero (returned in IS_BTC and IS_BTT packets)
    0, // connection to display the button (0 = local / 255 = all)

    options.id, // button ID (0 to 239)
    0, // Flags
    options.style || 0, // Button Style
    0,

    options.x,
    options.y,
    options.width,
    options.height,

    ...stringToBuffer(options.text || "", maxTextLength)
  ]);
}
