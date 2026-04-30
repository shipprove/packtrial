import { resolve } from "node:path";
import { parseArgv } from "../utils/argv.js";
import { runCommand } from "../utils/exec.js";
import type { PackTrialConfig } from "../core/types.js";

export async function resolveTarball(config: PackTrialConfig): Promise<string> {
  if (config.package.tarball) {
    return resolve(config.package.root, config.package.tarball);
  }

  const command = parseArgv(config.package.packCommand);
  const result = await runCommand(command, {
    cwd: resolve(config.package.root),
    timeoutMs: config.limits.commandTimeoutMs,
    maxOutputBytes: config.limits.maxOutputBytes
  });

  if (result.exitCode !== 0) {
    throw new Error(`Package command failed: ${result.stderr || result.stdout}`);
  }

  const parsed = JSON.parse(result.stdout) as Array<{ filename: string }>;
  const filename = parsed[0]?.filename;
  if (!filename) {
    throw new Error("Package command did not return a tarball filename.");
  }

  return resolve(config.package.root, filename);
}

