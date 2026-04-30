import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import { classifyFailure } from "../diagnostics/classifyFailure.js";
import { inspectTarball } from "../package/inspectTarball.js";
import { resolveTarball } from "../package/resolveTarball.js";
import { npmInstall, npmRunConsumerCommand } from "../packageManagers/npm.js";
import { pnpmInstall, pnpmRunConsumerCommand } from "../packageManagers/pnpm.js";
import { materializeTemplate } from "../templates/materialize.js";
import { createTempDir, removeDir } from "../utils/tempDir.js";
import type { MatrixResult, PackTrialConfig, PackageManagerName, TemplateName } from "./types.js";

export async function runMatrix(config: PackTrialConfig): Promise<MatrixResult[]> {
  const tarballPath = await resolveTarball(config);
  const artifact = await inspectTarball(tarballPath);
  const results: MatrixResult[] = [];

  for (const packageManager of config.packageManagers) {
    for (const template of config.templates) {
      results.push(await runCase(config, packageManager, template, artifact.tarballPath, artifact));
    }
  }

  return results;
}

async function runCase(
  config: PackTrialConfig,
  packageManager: PackageManagerName,
  template: TemplateName,
  tarballPath: string,
  artifact: Awaited<ReturnType<typeof inspectTarball>>
): Promise<MatrixResult> {
  const startedAt = Date.now();
  const workdir = await createTempDir();
  const consumerDir = join(workdir, `${packageManager}-${template}`);
  await mkdir(consumerDir, { recursive: true });
  const steps: MatrixResult["steps"] = [];

  try {
    const materialized = await materializeTemplate(template, consumerDir, artifact, config.cli?.command);
    const install = await installPackage(packageManager, consumerDir, tarballPath, config);
    steps.push(install);
    if (install.status !== "passed") {
      return failedResult(packageManager, template, startedAt, steps, classifyFailure(template, install));
    }

    const stepName = materialized.commands.build ? "build" : "run";
    const command = materialized.commands.build ?? materialized.commands.run;
    if (command) {
      const run = await runConsumerCommand(
        packageManager,
        consumerDir,
        command,
        stepName,
        config.limits.commandTimeoutMs,
        config.limits.maxOutputBytes
      );
      steps.push(run);
      if (run.status !== "passed") {
        return failedResult(packageManager, template, startedAt, steps, classifyFailure(template, run));
      }
    }

    return {
      case: { id: `${packageManager}:${template}`, packageManager, template },
      status: "passed",
      durationMs: Date.now() - startedAt,
      steps
    };
  } catch (error) {
    const prepare = {
      name: "prepare" as const,
      status: "failed" as const,
      durationMs: Date.now() - startedAt,
      stderr: error instanceof Error ? error.message : String(error)
    };
    steps.push(prepare);
    return failedResult(
      packageManager,
      template,
      startedAt,
      steps,
      classifyFailure(template, prepare, error instanceof Error ? error : undefined)
    );
  } finally {
    if (config.keepWorkdir === "never") {
      await removeDir(workdir);
    }
  }
}

function failedResult(
  packageManager: PackageManagerName,
  template: TemplateName,
  startedAt: number,
  steps: MatrixResult["steps"],
  failure: MatrixResult["failure"]
): MatrixResult {
  return {
    case: { id: `${packageManager}:${template}`, packageManager, template },
    status: "failed",
    durationMs: Date.now() - startedAt,
    steps,
    failure
  };
}

async function installPackage(
  packageManager: PackageManagerName,
  cwd: string,
  tarballPath: string,
  config: PackTrialConfig
) {
  const options = {
    cwd,
    tarballPath,
    commandTimeoutMs: config.limits.commandTimeoutMs,
    maxOutputBytes: config.limits.maxOutputBytes
  };
  return packageManager === "npm" ? await npmInstall(options) : await pnpmInstall(options);
}

async function runConsumerCommand(
  packageManager: PackageManagerName,
  cwd: string,
  command: string[],
  stepName: "build" | "run",
  commandTimeoutMs: number,
  maxOutputBytes: number
) {
  return packageManager === "npm"
    ? await npmRunConsumerCommand(cwd, command, stepName, commandTimeoutMs, maxOutputBytes)
    : await pnpmRunConsumerCommand(cwd, command, stepName, commandTimeoutMs, maxOutputBytes);
}
