import { InSimClientDefinition } from "./insim/client";
import { Nullable } from "./utils/nullable";
import { existsSync, readFileSync, writeFileSync } from "fs";
import logger from "./utils/logger";

export interface Config {
  clients: InSimClientDefinition[];
}

/**
 * The default config that is written to the config file on first use.
 */
export const defaultConfig: Config = {
  clients: [
    {
      host: "localhost"
    }
  ]
};

/**
 * Attempts to load the given config file. The file is created with default parameters if
 * not found.
 * @param filePath The file path of the json config to load.
 * @returns The config, or null if it failed to load.
 */
export function loadConfig(filePath: string): Nullable<Config> {
  logger.info(`Loading config from ${filePath}...`);
  const configExists = existsSync(filePath);

  if (!configExists) {
    logger.warn("Config file doesn't exist... creating with default parameters.")
    writeFileSync(
      filePath, 
      JSON.stringify(defaultConfig, null, 2)
    );
    logger.info("Please modify the newly created config file and run the program again :)")
    return null;
  }

  try {
    const configJson = readFileSync(filePath, {encoding: "utf8"});
    const config: Config = JSON.parse(configJson);

    logger.info("Successfully loaded config.");
    return config;
    
  } catch (err) {
    logger.error("Config failed to load! Please check config file formatting.");
    return null;
  }
}
