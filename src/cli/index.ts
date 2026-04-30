#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { cac } from "cac";
import { DEFAULT_CONFIG, parseConfig } from "../config/schema.js";
import { loadPackTrialConfig } from "../config/loadConfig.js";
import { runMatrix } from "../core/runMatrix.js";
import { renderTerminalReport } from "../report/terminalReport.js";
import { listTemplates } from "../templates/registry.js";

const cli = cac("packtrial");

cli
  .command("run", "Run the consumer compatibility matrix.")
  .option("--package <path>", "Use an existing package tarball.")
  .option("--pm <names>", "Comma-separated package managers.")
  .option("--template <names>", "Comma-separated consumer templates.")
  .option("--out-dir <dir>", "Report output directory.", {
    default: DEFAULT_CONFIG.report.outputDir
  })
  .option("--fail-on <mode>", "Failure behavior: any-failure or never.", {
    default: DEFAULT_CONFIG.failOn
  })
  .option("--cli-command <command>", "Command argv string for CLI template.")
  .option("--keep-workdir <mode>", "Temp workspace policy: never, on-failure, always.", {
    default: DEFAULT_CONFIG.keepWorkdir
  })
  .action(async (options) => {
    const loaded = await loadPackTrialConfig();
    const config = parseConfig({
      ...loaded,
      package: {
        ...loaded.package,
        tarball: options.package
      },
      packageManagers: splitOption(options.pm, loaded.packageManagers),
      templates: splitOption(options.template, loaded.templates),
      cli: options.cliCommand ? { command: options.cliCommand } : loaded.cli,
      report: {
        ...loaded.report,
        outputDir: options.outDir ?? loaded.report.outputDir
      },
      failOn: options.failOn ?? loaded.failOn,
      keepWorkdir: options.keepWorkdir ?? loaded.keepWorkdir
    });
    const results = await runMatrix(config);
    console.log(renderTerminalReport(results));
    if (config.failOn === "any-failure" && results.some((result) => result.status === "failed")) {
      process.exitCode = 1;
    }
  });

cli.command("list-templates", "List available consumer templates.").action(() => {
  for (const template of listTemplates()) {
    console.log(`${template.name}\t${template.description}`);
  }
});

cli.command("init", "Create a packtrial.config.ts file.").action(async () => {
  const contents = `import { defineConfig } from "@shipprove/packtrial";

export default defineConfig({
  package: {
    root: ".",
    packCommand: "npm pack --json"
  },
  packageManagers: ["npm", "pnpm"],
  templates: ["node-esm", "node-cjs", "ts-node16", "ts-bundler", "cli-basic"],
  report: {
    outputDir: ".packtrial",
    formats: ["terminal", "json", "markdown"]
  },
  failOn: "any-failure",
  keepWorkdir: "never",
  allowFailures: []
});
`;

  try {
    await writeFile("packtrial.config.ts", contents, { flag: "wx" });
    console.log("Created packtrial.config.ts");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST") {
      console.error("packtrial.config.ts already exists.");
      process.exitCode = 1;
      return;
    }
    throw error;
  }
});

cli.command("diagnose <report>", "Re-display diagnostics from a report.").action(() => {
  console.error("packtrial diagnose is not implemented yet. Report diagnostics arrive in a later PR.");
  process.exitCode = 2;
});

cli.command("report <report>", "Render a report in another format.").action(() => {
  console.error("packtrial report is not implemented yet. Report rendering arrives in a later PR.");
  process.exitCode = 2;
});

cli.help();
cli.version("0.1.0");
cli.parse();

function splitOption<T extends string>(value: string | undefined, fallback: T[]): T[] {
  if (!value) {
    return fallback;
  }
  return value.split(",").map((item) => item.trim()).filter(Boolean) as T[];
}
