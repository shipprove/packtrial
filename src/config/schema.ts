import { z } from "zod";
import {
  DIAGNOSTIC_CODES,
  PACKAGE_MANAGER_NAMES,
  TEMPLATE_NAMES
} from "../core/constants.js";
import type { PackTrialConfig } from "../core/types.js";

export const DEFAULT_CONFIG: PackTrialConfig = {
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
  limits: {
    commandTimeoutMs: 120_000,
    totalTimeoutMs: 1_200_000,
    maxOutputBytes: 200_000,
    maxMarkdownBytes: 262_144
  },
  allowFailures: []
};

const templateNameSchema = z.enum(TEMPLATE_NAMES);
const packageManagerNameSchema = z.enum(PACKAGE_MANAGER_NAMES);
const diagnosticCodeSchema = z.enum(DIAGNOSTIC_CODES);

export const PACKTRIAL_CONFIG_SCHEMA = z.object({
  package: z
    .object({
      root: z.string().default(DEFAULT_CONFIG.package.root),
      tarball: z.string().optional(),
      packCommand: z.string().default(DEFAULT_CONFIG.package.packCommand)
    })
    .default(DEFAULT_CONFIG.package),
  packageManagers: z.array(packageManagerNameSchema).default(DEFAULT_CONFIG.packageManagers),
  templates: z.array(templateNameSchema).default(DEFAULT_CONFIG.templates),
  cli: z
    .object({
      command: z.string().optional()
    })
    .optional(),
  report: z
    .object({
      outputDir: z.string().default(DEFAULT_CONFIG.report.outputDir),
      formats: z
        .array(z.enum(["terminal", "json", "markdown"]))
        .default(DEFAULT_CONFIG.report.formats)
    })
    .default(DEFAULT_CONFIG.report),
  failOn: z.enum(["any-failure", "never"]).default(DEFAULT_CONFIG.failOn),
  keepWorkdir: z.enum(["never", "on-failure", "always"]).default(DEFAULT_CONFIG.keepWorkdir),
  limits: z
    .object({
      commandTimeoutMs: z.number().int().positive().default(DEFAULT_CONFIG.limits.commandTimeoutMs),
      totalTimeoutMs: z.number().int().positive().default(DEFAULT_CONFIG.limits.totalTimeoutMs),
      maxOutputBytes: z.number().int().positive().default(DEFAULT_CONFIG.limits.maxOutputBytes),
      maxMarkdownBytes: z.number().int().positive().default(DEFAULT_CONFIG.limits.maxMarkdownBytes)
    })
    .default(DEFAULT_CONFIG.limits),
  allowFailures: z
    .array(
      z.object({
        template: templateNameSchema.optional(),
        packageManager: packageManagerNameSchema.optional(),
        diagnosticCode: diagnosticCodeSchema,
        reason: z.string().min(1),
        until: z.string().optional()
      })
    )
    .default([])
});

export function parseConfig(config: unknown): PackTrialConfig {
  return PACKTRIAL_CONFIG_SCHEMA.parse(config);
}

