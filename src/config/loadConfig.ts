import { loadConfig } from "c12";
import { DEFAULT_CONFIG, parseConfig } from "./schema.js";
import type { PackTrialConfig } from "../core/types.js";

export async function loadPackTrialConfig(cwd = process.cwd()): Promise<PackTrialConfig> {
  const result = await loadConfig<Partial<PackTrialConfig>>({
    cwd,
    name: "packtrial",
    defaults: DEFAULT_CONFIG
  });

  return parseConfig(result.config);
}

