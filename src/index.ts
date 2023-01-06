import path from "path";
import { Config, loadConfig } from "./config";
import { db } from "./database";
import { InSimClient } from "./insim/client";
import { Nullable } from "./utils/nullable";

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

      // Update the leaderboard for each client.
      // TODO: Only call updateLeaderboard on clients that actually need to be updated.
      clients.forEach(c => c.updateLeaderboard());
    });
    
    // Attempt to connect (reconnecting will be handled automatically).
    client.connect();
  });
}
