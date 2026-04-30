import { TEMPLATE_NAMES } from "../core/constants.js";
import type { TemplateName } from "../core/types.js";

export type TemplateSummary = {
  name: TemplateName;
  description: string;
};

export const TEMPLATE_REGISTRY: TemplateSummary[] = [
  {
    name: "node-esm",
    description: "Imports the package from an ESM Node.js consumer."
  },
  {
    name: "node-cjs",
    description: "Requires the package from a CommonJS Node.js consumer."
  },
  {
    name: "ts-node16",
    description: "Type-checks the package with TypeScript Node16 resolution."
  },
  {
    name: "ts-bundler",
    description: "Type-checks the package with TypeScript bundler resolution."
  },
  {
    name: "cli-basic",
    description: "Executes the installed package binary."
  }
];

export function listTemplates(): TemplateSummary[] {
  return TEMPLATE_REGISTRY;
}

export function isTemplateName(value: string): value is TemplateName {
  return TEMPLATE_NAMES.includes(value as TemplateName);
}

