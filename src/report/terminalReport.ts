import type { MatrixResult } from "../core/types.js";

export function renderTerminalReport(results: MatrixResult[]): string {
  const lines = ["Consumer Matrix", "---------------"];
  for (const result of results) {
    const suffix = result.failure ? ` ${result.failure.code}` : "";
    lines.push(`${result.case.template} / ${result.case.packageManager}: ${result.status}${suffix}`);
  }
  return lines.join("\n");
}

