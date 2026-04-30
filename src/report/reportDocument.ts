import type { FailureDiagnosis, MatrixResult, PackTrialStatus, ReportDocument } from "../core/types.js";
import { redact } from "./redact.js";

export function createReportDocument(results: MatrixResult[], version: string): ReportDocument {
  const redactedResults = results.map(redactResult);
  const findings = redactedResults
    .map((result) => result.failure)
    .filter((finding): finding is FailureDiagnosis => Boolean(finding));
  const failed = redactedResults.filter((result) => result.status === "failed").length;
  const skipped = redactedResults.filter((result) => result.status === "skipped").length;
  const passed = redactedResults.filter((result) => result.status === "passed").length;
  const status: PackTrialStatus = failed > 0 ? "failed" : skipped === redactedResults.length ? "skipped" : "passed";

  return {
    schemaVersion: "1.0",
    tool: "packtrial",
    toolVersion: version,
    status,
    summary: {
      total: redactedResults.length,
      passed,
      failed,
      skipped
    },
    results: redactedResults,
    findings
  };
}

function redactResult(result: MatrixResult): MatrixResult {
  return {
    ...result,
    steps: result.steps.map((step) => ({
      ...step,
      stdout: redact(step.stdout),
      stderr: redact(step.stderr)
    }))
  };
}

