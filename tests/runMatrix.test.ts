import { mkdtemp, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/config/schema.js";
import { runMatrix } from "../src/core/runMatrix.js";
import { runCommand } from "../src/utils/exec.js";

describe("runMatrix", () => {
  it(
    "installs and runs a packed fixture in npm consumers",
    async () => {
      const tempDir = await mkdtemp(join(tmpdir(), "packtrial-test-"));
      const fixtureDir = resolve("fixtures/packages/good-dual");
      const packDir = join(tempDir, "packs");
      await mkdir(packDir);

      const pack = await runCommand(["npm", "pack", "--json", "--pack-destination", packDir], {
        cwd: fixtureDir,
        timeoutMs: 120_000,
        maxOutputBytes: 200_000
      });
      expect(pack.exitCode).toBe(0);
      const [{ filename }] = JSON.parse(pack.stdout) as Array<{ filename: string }>;

      const results = await runMatrix({
        ...DEFAULT_CONFIG,
        package: {
          ...DEFAULT_CONFIG.package,
          root: packDir,
          tarball: filename
        },
        packageManagers: ["npm", "pnpm"],
        templates: ["node-esm", "node-cjs", "ts-node16", "ts-bundler", "cli-basic"],
        cli: {
          command: "fixture-cli --help"
        }
      });

      expect(results.map((result) => result.status)).toEqual([
        "passed",
        "passed",
        "passed",
        "passed",
        "passed",
        "passed",
        "passed",
        "passed",
        "passed",
        "passed"
      ]);
    },
    180_000
  );

  it(
    "classifies missing TypeScript declarations",
    async () => {
      const tempDir = await mkdtemp(join(tmpdir(), "packtrial-test-"));
      const fixtureDir = resolve("fixtures/packages/missing-types");
      const packDir = join(tempDir, "packs");
      await mkdir(packDir);

      const pack = await runCommand(["npm", "pack", "--json", "--pack-destination", packDir], {
        cwd: fixtureDir,
        timeoutMs: 120_000,
        maxOutputBytes: 200_000
      });
      expect(pack.exitCode).toBe(0);
      const [{ filename }] = JSON.parse(pack.stdout) as Array<{ filename: string }>;

      const results = await runMatrix({
        ...DEFAULT_CONFIG,
        package: {
          ...DEFAULT_CONFIG.package,
          root: packDir,
          tarball: filename
        },
        packageManagers: ["npm"],
        templates: ["ts-bundler"]
      });

      expect(results[0]?.status).toBe("failed");
      expect(results[0]?.failure?.code).toBe("MISSING_TYPES");
    },
    180_000
  );
});
