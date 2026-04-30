import { join, delimiter } from "node:path";
import { runCommand } from "../utils/exec.js";
import type { StepResult } from "../core/types.js";

export type NpmRunnerOptions = {
  cwd: string;
  tarballPath: string;
  commandTimeoutMs: number;
  maxOutputBytes: number;
};

export async function npmInstall(options: NpmRunnerOptions): Promise<StepResult> {
  const result = await runCommand(["npm", "install", options.tarballPath], {
    cwd: options.cwd,
    timeoutMs: options.commandTimeoutMs,
    maxOutputBytes: options.maxOutputBytes
  });

  return {
    name: "install",
    command: result.command,
    status: result.exitCode === 0 ? "passed" : "failed",
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    truncated: result.truncated,
    originalOutputBytes: result.originalOutputBytes
  };
}

export async function npmRunConsumerCommand(
  cwd: string,
  command: string[],
  commandTimeoutMs: number,
  maxOutputBytes: number
): Promise<StepResult> {
  const result = await runCommand(command, {
    cwd,
    timeoutMs: commandTimeoutMs,
    maxOutputBytes,
    env: {
      PATH: `${join(cwd, "node_modules", ".bin")}${delimiter}${process.env.PATH ?? ""}`
    }
  });

  return {
    name: "run",
    command: result.command,
    status: result.exitCode === 0 ? "passed" : "failed",
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    truncated: result.truncated,
    originalOutputBytes: result.originalOutputBytes
  };
}

