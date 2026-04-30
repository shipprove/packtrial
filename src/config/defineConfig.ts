import type { PackTrialConfig } from "../core/types.js";

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<U>
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

export function defineConfig(config: DeepPartial<PackTrialConfig>): DeepPartial<PackTrialConfig> {
  return config;
}
