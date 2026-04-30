import type { DiagnosticCode, FailureDiagnosis, StepResult, TemplateName } from "../core/types.js";

export function classifyFailure(template: TemplateName, step: StepResult, fallback?: Error): FailureDiagnosis {
  const output = `${step.stderr ?? ""}\n${step.stdout ?? ""}\n${fallback?.message ?? ""}`;
  const code = inferDiagnosticCode(template, output);

  return {
    code,
    message: failureMessage(code),
    suggestion: failureSuggestion(code)
  };
}

function inferDiagnosticCode(template: TemplateName, output: string): DiagnosticCode {
  if (template === "cli-basic" && /not found|could not determine executable|No such file/i.test(output)) {
    return "CLI_BIN_MISSING";
  }
  if (/Cannot find module|ERR_MODULE_NOT_FOUND/i.test(output)) {
    return "MISSING_EXPORT";
  }
  if (/require\(\) of ES Module|ERR_REQUIRE_ESM/i.test(output)) {
    return "MODULE_FORMAT_MISMATCH";
  }
  return "COMMAND_FAILED";
}

function failureMessage(code: DiagnosticCode): string {
  switch (code) {
    case "CLI_BIN_MISSING":
      return "The CLI binary could not be executed from the consumer project.";
    case "MISSING_EXPORT":
      return "The package entrypoint could not be resolved by the consumer.";
    case "MODULE_FORMAT_MISMATCH":
      return "The package module format does not match the consumer template.";
    default:
      return "The consumer command failed.";
  }
}

function failureSuggestion(code: DiagnosticCode): string {
  switch (code) {
    case "CLI_BIN_MISSING":
      return "Check package.json bin entries and packed files.";
    case "MISSING_EXPORT":
      return "Check package.json exports, main, and files entries.";
    case "MODULE_FORMAT_MISMATCH":
      return "Document unsupported module formats or provide a compatible export.";
    default:
      return "Re-run with the generated consumer workspace kept for debugging.";
  }
}

