import { describe, expect, it } from "vitest";
import { DIAGNOSTIC_CODES, TEMPLATE_NAMES } from "../src/core/constants.js";
import { listTemplates } from "../src/templates/registry.js";

describe("public surface constants", () => {
  it("lists every MVP template", () => {
    expect(listTemplates().map((template) => template.name)).toEqual([...TEMPLATE_NAMES]);
  });

  it("keeps diagnostic codes stable and machine-readable", () => {
    expect(DIAGNOSTIC_CODES).toContain("MISSING_TYPES");
    expect(DIAGNOSTIC_CODES.every((code) => /^[A-Z_]+$/.test(code))).toBe(true);
  });
});

