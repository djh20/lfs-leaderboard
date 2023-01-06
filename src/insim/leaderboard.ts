import { Lap } from "@prisma/client";
import moment from "moment";
import { Socket } from "net";
import { stringToBuffer } from "../utils/string";
import { InSimPacketType } from "./packet";

interface LeaderboardOptions {
  title: string;
  slots: number;
  laps: Lap[];
  yOffset?: number;
  firstButtonId?: number;
}

interface LeaderboardInfo {
  height: number;
  nextButtonId: number;
}

export function createLeaderboard(socket: Socket, options: LeaderboardOptions): LeaderboardInfo {
  // We should never exceed 99 characters (1 null character).
  const maxTextLength = 100;
  const slotHeight = 7;

  /**
   * The horizontal margin around each slot.
   */
  const slotMargin = 1;

  const height = 10+(options.slots*slotHeight)+2;
  const yOffset = options.yOffset || 0;

  let nextButtonId = options.firstButtonId || 0;
    
  // Title
  socket.write(
    Buffer.from([
      3 + (maxTextLength/4), // 3 + TEXT_SIZE/4
      InSimPacketType.ISP_BTN,
      1, // non-zero (returned in IS_BTC and IS_BTT packets)
      0, // connection to display the button (0 = local / 255 = all)

      nextButtonId++, // button ID (0 to 239)
      0, // Flags
      0x41, // Button Style
      0,

      2,
      18 + yOffset,
      30,
      10,

      ...stringToBuffer(options.title, maxTextLength)
    ])
  );
  
  // Background
  socket.write(
    Buffer.from([
      3 + (maxTextLength/4), // 3 + TEXT_SIZE/4
      InSimPacketType.ISP_BTN,
      1, // non-zero (returned in IS_BTC and IS_BTT packets)
      0, // connection to display the button (0 = local / 255 = all)

      nextButtonId++, // button ID (0 to 239)
      0, // Flags
      32, // Button Style
      0,

      2,
      18 + yOffset,
      30,
      height, // Calculate height depending on number of slots.

      ...Buffer.alloc(maxTextLength)
    ])
  );
  
  // Create a button for each slot.
  for (let i = 0; i < options.slots; i++) {
    let text = `${i+1}. `;

    if (i < options.laps.length) {
      const lap = options.laps[i];
      const timeStr = moment(lap.timeMs).format("m:ss.SS");
      text += `${lap.playerName}  ${timeStr}`;
    } else {
      text += "----  ----"
    }
    
    socket.write(
      Buffer.from([
        3 + (maxTextLength/4), // 3 + TEXT_SIZE/4
        InSimPacketType.ISP_BTN,
        1, // non-zero (returned in IS_BTC and IS_BTT packets)
        0, // connection to display the button (0 = local / 255 = all)

        nextButtonId++, // button ID (0 to 239)
        0, // Flags
        99, // Button Style
        0,

        2+slotMargin,
        28 + yOffset + (i*slotHeight),
        30-(slotMargin*2),
        slotHeight,

        ...stringToBuffer(text, maxTextLength)
      ])
    );
  }

  return { height, nextButtonId };
}
