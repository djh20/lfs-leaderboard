import path from "path";
import { Config, loadConfig } from "./config";
import { db } from "./database";
import { InSimClient } from "./insim/client";
import { getTrackName } from "./insim/track";
import { getVehicleName } from "./insim/vehicle";
import logger from "./utils/logger";
import { Nullable } from "./utils/nullable";
import { formatLapTime } from "./utils/time";

const { version } = require("../package.json");

console.log(`<< LFS Leaderboard >>`);
console.log(`Version: ${version}`);
console.log("Created by djh20\n");

const configPath = path.resolve(__dirname, "../config.json")
const config: Nullable<Config> = loadConfig(configPath);

if (config) {
  // Create a client instance for each client definition in the config.
  const clients = config.clients.map(d => new InSimClient(d));

  clients.forEach(client => {
    // Listen for lap events from the client.
    client.on("lap", async (lapTimeMs: number) => {
      if (!client.playerName) return;
      if (!client.vehicleCode) return;
      if (!client.trackCode) return;
      
      // Add a lap record to the database.
      await db.lap.create({
        data: {
          playerName: client.playerName,
          vehicleCode: client.vehicleCode,
          trackCode: client.trackCode,
          timeMs: lapTimeMs
        }
      });

      const formattedLapTime = formatLapTime(lapTimeMs);
      const vehicleName = await getVehicleName(client.vehicleCode);
      const trackName = getTrackName(client.trackCode);

      logger.info(`${client.playerName} got a lap time of ${formattedLapTime}`);

      client.updateLeaderboards();

      clients.forEach(otherClient => {
        if (otherClient == client) return;

        // Update the leaderboards for each client.
        otherClient.updateLeaderboards();
        
        otherClient.sendMessage(`
          ${client.playerName} got ${formattedLapTime} on ${trackName} (${vehicleName})
        `);
      });
    });
    
    // Attempt to connect (reconnecting will be handled automatically).
    client.connect();
  });
}
