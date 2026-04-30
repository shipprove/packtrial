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
    scripts: {},
    devDependencies:
      template === "ts-node16" || template === "ts-bundler"
        ? {
            typescript: "^5.9.3"
          }
        : undefined
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

  if (template === "ts-node16" || template === "ts-bundler") {
    await writeFile(
      join(dir, "index.ts"),
      `import { ok } from ${JSON.stringify(artifact.packageJson.name)};\nconst value: boolean = ok;\nconsole.log(value);\n`
    );
    await writeFile(
      join(dir, "tsconfig.json"),
      `${JSON.stringify(tsConfig(template), null, 2)}\n`
    );
    return { commands: { build: ["node", "node_modules/typescript/bin/tsc", "--noEmit"] } };
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

function tsConfig(template: "ts-node16" | "ts-bundler"): Record<string, unknown> {
  if (template === "ts-node16") {
    return {
      compilerOptions: {
        module: "Node16",
        moduleResolution: "Node16",
        target: "ES2022",
        strict: true,
        skipLibCheck: true
      },
      include: ["index.ts"]
    };
  }

  return {
    compilerOptions: {
      module: "ESNext",
      moduleResolution: "Bundler",
      target: "ES2022",
      strict: true,
      skipLibCheck: true
    },
    include: ["index.ts"]
  };
}
