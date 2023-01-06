import { db } from "../database";
import axios from "axios";
import logger from "../utils/logger";
import { VehicleMod } from "@prisma/client";

let officialVehicleNames = new Map<string, string>([
  ["UF1", "UF 1000"],
  ["XFG", "XF GTI"],
  ["XRG", "XR GT"],
  ["LX4", "LX4"],
  ["LX6", "LX6"],
  ["RB4", "RB4 GT"],
  ["FXO", "FXO TURBO"],
  ["XRT", "XR GT TURBO"],
  ["RAC", "RACEABOUT"],
  ["FZ5", "FZ50"],
  ["UFR", "UF GTR"],
  ["XFR", "XF GTR"],
  ["FXR", "FXO GTR"],
  ["XRR", "XR GTR"],
  ["FZR", "FZ50 GTR"],
  ["MRT", "MRT5"],
  ["FBM", "FORMULA BMW FB02"],
  ["FOX", "FORMULA XR"],
  ["FO8", "FORMULA V8"],
  ["BF1", "BMW SAUBER F1.06"],
]);

let vehicleModCache = new Map<string, VehicleMod>();

export async function getVehicleName(code: string): Promise<string> {
  const isOfficialVehicle = officialVehicleNames.has(code);
  if (isOfficialVehicle) return officialVehicleNames.get(code)!;

  //const mod = await db.vehicleMod.findUnique({ where: { id: code } });
  const mod = await getVehicleModInfo(code);
  if (mod) return mod.name;

  return code;
}

export async function getVehicleModInfo(code: string): Promise<VehicleMod | null> {
  const cachedMod = vehicleModCache.get(code);
  if (cachedMod) return cachedMod;

  const mod = await db.vehicleMod.findUnique({ where: { id: code } });
  if (!mod) return null;

  vehicleModCache.set(code, mod);
  return mod;
}

export async function updateVehicleModInfo(code: string) {
  let mod = await db.vehicleMod.findUnique({ where: { id: code } });
  if (mod) {
    const msSinceLastFetch = Date.now() - mod.fetchedAt.getTime();

    // Don't fetch again within 48 hours.
    if (msSinceLastFetch < 1000 * 60 * 60 * 48) return;
  }

  logger.info(`Fetching vehicle mod info for ${code}`);

  const modUrl = `https://www.lfs.net/files/vehmods/${code}`;
  const response = await axios.get(modUrl).catch((err) =>
    logger.error(`Failed to fetch mod vehicle info! (${err})`)
  );

  if (!response || response.status != 200) return;

  const startSub = "id=\"modName\">";
  const endSub = "</div>";
  
  let data: string = response.data;

  const startIndex = data.indexOf(startSub) + startSub.length;
  let vehicleName = data.slice(startIndex);

  const endIndex = vehicleName.indexOf(endSub);
  vehicleName = vehicleName.slice(0, endIndex).trim();

  if (!vehicleName) return;

  mod = await db.vehicleMod.upsert({
    where: {
      id: code
    },
    create: {
      id: code,
      name: vehicleName
    },
    update: {
      name: vehicleName,
      fetchedAt: new Date(Date.now())
    }
  });

  if (!mod) return;
  vehicleModCache.set(code, mod);
}