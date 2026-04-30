import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("dogfood script", () => {
  it("uses npm pack output instead of a hard-coded tarball name", async () => {
    const script = await readFile("scripts/dogfood.mjs", "utf8");

    expect(script).toContain("npm");
    expect(script).toContain("pack");
    expect(script).toContain("JSON.parse");
    expect(script).not.toContain("shipprove-packtrial-0.1.0.tgz");
  });
});

