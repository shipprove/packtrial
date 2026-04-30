import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/config/schema.js";
import { createReportDocument } from "../src/report/reportDocument.js";
import { renderMarkdownReport } from "../src/report/markdownReport.js";
import { redact } from "../src/report/redact.js";
import { writeReports } from "../src/report/writeReports.js";
import type { MatrixResult } from "../src/core/types.js";

const failedResult: MatrixResult = {
  case: {
    id: "npm:node-esm",
    packageManager: "npm",
    template: "node-esm"
  },
  status: "failed",
  durationMs: 10,
  steps: [
    {
      name: "run",
      status: "failed",
      durationMs: 10,
      stderr: "Bearer abcdefghijklmnopqrstuvwxyz123456"
    }
  ],
  failure: {
    code: "COMMAND_FAILED",
    message: "The consumer command failed.",
    suggestion: "Check the output."
  }
};

describe("reports", () => {
  it("creates a redacted schema-versioned report", () => {
    const report = createReportDocument([failedResult], "0.1.0");

    expect(report.schemaVersion).toBe("1.0");
    expect(report.status).toBe("failed");
    expect(report.steps).toBeUndefined();
    expect(report.results[0]?.steps[0]?.stderr).toContain("[REDACTED]");
  });

  it("limits markdown report size", () => {
    const report = createReportDocument([failedResult], "0.1.0");
    const markdown = renderMarkdownReport(report, 120);

    expect(Buffer.byteLength(markdown)).toBeLessThanOrEqual(200);
    expect(markdown).toContain("truncated");
  });

  it("writes GitHub Step Summary when configured by the environment", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "packtrial-report-"));
    const summaryPath = join(tempDir, "summary.md");
    process.env.GITHUB_STEP_SUMMARY = summaryPath;

    try {
      const report = createReportDocument([failedResult], "0.1.0");
      await writeReports(report, {
        ...DEFAULT_CONFIG,
        report: {
          outputDir: join(tempDir, "out"),
          formats: ["json", "markdown"]
        }
      });

      expect(await readFile(summaryPath, "utf8")).toContain("PackTrial Report");
    } finally {
      delete process.env.GITHUB_STEP_SUMMARY;
    }
  });

  it("redacts known token shapes", () => {
    expect(redact("token ghp_abcdefghijklmnopqrstuvwxyz123456")).toBe("token [REDACTED]");
  });
});

