import { describe, expect, it } from "vitest";
import { defineConfig } from "../src/config/defineConfig.js";
import { DEFAULT_CONFIG, parseConfig } from "../src/config/schema.js";

describe("parseConfig", () => {
  it("fills defaults", () => {
    expect(parseConfig({})).toEqual(DEFAULT_CONFIG);
  });

  it("accepts allow-failure placeholders", () => {
    const config = parseConfig({
      allowFailures: [
        {
          template: "node-cjs",
          packageManager: "npm",
          diagnosticCode: "MODULE_FORMAT_MISMATCH",
          reason: "ESM-only package"
        }
      ]
    });

    expect(config.allowFailures).toHaveLength(1);
  });

  it("allows nested partial config authoring", () => {
    const config = defineConfig({
      package: {
        root: "packages/example"
      },
      report: {
        outputDir: "tmp"
      }
    });

    expect(config.package?.root).toBe("packages/example");
  });
});
