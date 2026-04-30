export type PackageManagerName = "npm" | "pnpm";

export type TemplateName =
  | "node-esm"
  | "node-cjs"
  | "ts-node16"
  | "ts-bundler"
  | "cli-basic";

export type DiagnosticCode =
  | "MISSING_FILE"
  | "MISSING_EXPORT"
  | "MISSING_TYPES"
  | "CLI_BIN_MISSING"
  | "CLI_SHEBANG_MISSING"
  | "MODULE_FORMAT_MISMATCH"
  | "COMMAND_FAILED"
  | "PACKAGE_MANAGER_UNAVAILABLE";

export type PackTrialStatus = "passed" | "failed" | "skipped";

export type PackTrialConfig = {
  package: {
    root: string;
    tarball?: string;
    packCommand: string;
  };
  packageManagers: PackageManagerName[];
  templates: TemplateName[];
  cli?: {
    command?: string;
  };
  report: {
    outputDir: string;
    formats: Array<"terminal" | "json" | "markdown">;
  };
  failOn: "any-failure" | "never";
  keepWorkdir: "never" | "on-failure" | "always";
  limits: {
    commandTimeoutMs: number;
    totalTimeoutMs: number;
    maxOutputBytes: number;
    maxMarkdownBytes: number;
  };
  allowFailures: Array<{
    template?: TemplateName;
    packageManager?: PackageManagerName;
    diagnosticCode: DiagnosticCode;
    reason: string;
    until?: string;
  }>;
};

export type MatrixCase = {
  id: string;
  packageManager: PackageManagerName;
  template: TemplateName;
};

export type StepResult = {
  name: "prepare" | "install" | "build" | "run";
  command?: string[];
  status: PackTrialStatus;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  durationMs: number;
  truncated?: boolean;
  originalOutputBytes?: number;
};

export type FailureDiagnosis = {
  code: DiagnosticCode;
  message: string;
  suggestion: string;
};

export type MatrixResult = {
  case: MatrixCase;
  status: PackTrialStatus;
  durationMs: number;
  steps: StepResult[];
  failure?: FailureDiagnosis;
};

export type ReportDocument = {
  schemaVersion: "1.0";
  tool: "packtrial";
  toolVersion: string;
  status: PackTrialStatus;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  results: MatrixResult[];
  findings: FailureDiagnosis[];
};

