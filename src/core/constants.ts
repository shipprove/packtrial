import type { DiagnosticCode, PackageManagerName, TemplateName } from "./types.js";

export const TEMPLATE_NAMES = [
  "node-esm",
  "node-cjs",
  "ts-node16",
  "ts-bundler",
  "cli-basic"
] as const satisfies readonly TemplateName[];

export const PACKAGE_MANAGER_NAMES = [
  "npm",
  "pnpm"
] as const satisfies readonly PackageManagerName[];

export const DIAGNOSTIC_CODES = [
  "MISSING_FILE",
  "MISSING_EXPORT",
  "MISSING_TYPES",
  "CLI_BIN_MISSING",
  "CLI_SHEBANG_MISSING",
  "MODULE_FORMAT_MISMATCH",
  "COMMAND_FAILED",
  "PACKAGE_MANAGER_UNAVAILABLE"
] as const satisfies readonly DiagnosticCode[];

