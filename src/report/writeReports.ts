import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { PackTrialConfig, ReportDocument } from "../core/types.js";
import { renderJsonReport } from "./jsonReport.js";
import { renderMarkdownReport } from "./markdownReport.js";
import { renderTerminalReport } from "./terminalReport.js";

export async function writeReports(report: ReportDocument, config: PackTrialConfig): Promise<void> {
  await mkdir(config.report.outputDir, { recursive: true });

  if (config.report.formats.includes("json")) {
    await writeFile(join(config.report.outputDir, "report.json"), renderJsonReport(report));
  }
  if (config.report.formats.includes("markdown")) {
    await writeFile(
      join(config.report.outputDir, "report.md"),
      renderMarkdownReport(report, config.limits.maxMarkdownBytes)
    );
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    await mkdir(dirname(process.env.GITHUB_STEP_SUMMARY), { recursive: true });
    await writeFile(
      process.env.GITHUB_STEP_SUMMARY,
      renderMarkdownReport(report, config.limits.maxMarkdownBytes),
      { flag: "a" }
    );
  }
}

export function renderConfiguredTerminalReport(report: ReportDocument): string {
  return renderTerminalReport(report.results);
}

