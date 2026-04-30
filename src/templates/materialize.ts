import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getPrimaryBinName, type PackageArtifact } from "../package/inspectTarball.js";
import { parseArgv } from "../utils/argv.js";
import type { TemplateName } from "../core/types.js";

export type MaterializedTemplate = {
  commands: {
    build?: string[];
    run?: string[];
  };
};

export async function materializeTemplate(
  template: TemplateName,
  dir: string,
  artifact: PackageArtifact,
  cliCommand?: string
): Promise<MaterializedTemplate> {
  await mkdir(dir, { recursive: true });

  const packageJson = {
    private: true,
    type: template === "node-cjs" ? "commonjs" : "module",
    scripts: {}
  };
  await writeFile(join(dir, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`);

  if (template === "node-esm") {
    await writeFile(
      join(dir, "index.mjs"),
      `import * as pkg from ${JSON.stringify(artifact.packageJson.name)};\nconsole.log(Boolean(pkg));\n`
    );
    return { commands: { run: ["node", "index.mjs"] } };
  }

  if (template === "node-cjs") {
    await writeFile(
      join(dir, "index.cjs"),
      `const pkg = require(${JSON.stringify(artifact.packageJson.name)});\nconsole.log(Boolean(pkg));\n`
    );
    return { commands: { run: ["node", "index.cjs"] } };
  }

  if (template === "cli-basic") {
    const command = cliCommand
      ? parseArgv(cliCommand)
      : inferCliCommand(artifact);
    return { commands: { run: command } };
  }

  throw new Error(`Template ${template} is not implemented in this PR.`);
}

function inferCliCommand(artifact: PackageArtifact): string[] {
  const binName = getPrimaryBinName(artifact.packageJson);
  if (!binName) {
    throw new Error("CLI template requires a package bin or --cli-command.");
  }
  return [binName, "--help"];
}

