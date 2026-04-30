import type { ReportDocument } from "../core/types.js";

export function renderJsonReport(report: ReportDocument): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

