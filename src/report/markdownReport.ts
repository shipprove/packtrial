import type { ReportDocument } from "../core/types.js";

export function renderMarkdownReport(report: ReportDocument, maxBytes: number): string {
  const lines = [
    "# PackTrial Report",
    "",
    `Status: **${report.status}**`,
    "",
    "| Template | Package manager | Status | Diagnostic |",
    "|---|---|---|---|"
  ];

  for (const result of report.results) {
    lines.push(
      `| ${result.case.template} | ${result.case.packageManager} | ${result.status} | ${result.failure?.code ?? ""} |`
    );
  }

  if (report.findings.length > 0) {
    lines.push("", "## Findings", "");
    for (const finding of report.findings) {
      lines.push(`- **${finding.code}**: ${finding.message} ${finding.suggestion}`);
    }
  }

  return limitMarkdown(`${lines.join("\n")}\n`, maxBytes);
}

function limitMarkdown(markdown: string, maxBytes: number): string {
  const buffer = Buffer.from(markdown);
  if (buffer.byteLength <= maxBytes) {
    return markdown;
  }
  const suffix = "\n\n_Report truncated because it exceeded the configured maximum size._\n";
  return `${buffer.subarray(0, Math.max(0, maxBytes - Buffer.byteLength(suffix))).toString("utf8")}${suffix}`;
}

