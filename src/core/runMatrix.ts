import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import { classifyFailure } from "../diagnostics/classifyFailure.js";
import { inspectTarball } from "../package/inspectTarball.js";
import { resolveTarball } from "../package/resolveTarball.js";
import { npmInstall, npmRunConsumerCommand } from "../packageManagers/npm.js";
import { materializeTemplate } from "../templates/materialize.js";
import { createTempDir, removeDir } from "../utils/tempDir.js";
import type { MatrixResult, PackTrialConfig, PackageManagerName, TemplateName } from "./types.js";

export async function runMatrix(config: PackTrialConfig): Promise<MatrixResult[]> {
  const tarballPath = await resolveTarball(config);
  const artifact = await inspectTarball(tarballPath);
  const results: MatrixResult[] = [];

  for (const packageManager of config.packageManagers) {
    for (const template of config.templates) {
      if (!isImplementedPackageManager(packageManager) || !isImplementedTemplate(template)) {
        results.push(skippedResult(packageManager, template));
        continue;
      }

      results.push(await runCase(config, packageManager, template, artifact.tarballPath, artifact));
    }
  }

  return results;
}

async function runCase(
  config: PackTrialConfig,
  packageManager: "npm",
  template: "node-esm" | "node-cjs" | "cli-basic",
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
    const install = await npmInstall({
      cwd: consumerDir,
      tarballPath,
      commandTimeoutMs: config.limits.commandTimeoutMs,
      maxOutputBytes: config.limits.maxOutputBytes
    });
    steps.push(install);
    if (install.status !== "passed") {
      return failedResult(packageManager, template, startedAt, steps, classifyFailure(template, install));
    }

    if (materialized.commands.run) {
      const run = await npmRunConsumerCommand(
        consumerDir,
        materialized.commands.run,
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

function isImplementedPackageManager(packageManager: PackageManagerName): packageManager is "npm" {
  return packageManager === "npm";
}

function isImplementedTemplate(template: TemplateName): template is "node-esm" | "node-cjs" | "cli-basic" {
  return template === "node-esm" || template === "node-cjs" || template === "cli-basic";
}

function skippedResult(packageManager: PackageManagerName, template: TemplateName): MatrixResult {
  return {
    case: { id: `${packageManager}:${template}`, packageManager, template },
    status: "skipped",
    durationMs: 0,
    steps: [],
    failure: {
      code: "PACKAGE_MANAGER_UNAVAILABLE",
      message: "This package manager or template is not implemented in this PR.",
      suggestion: "Use npm with node-esm, node-cjs, or cli-basic for now."
    }
  };
}

function failedResult(
  packageManager: "npm",
  template: "node-esm" | "node-cjs" | "cli-basic",
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

