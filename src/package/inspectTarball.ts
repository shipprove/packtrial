import { dirname, resolve } from "node:path";
import { runCommand } from "../utils/exec.js";

export type PackageArtifact = {
  tarballPath: string;
  packageJson: {
    name: string;
    bin?: string | Record<string, string>;
    type?: string;
  };
};

export async function inspectTarball(tarballPath: string): Promise<PackageArtifact> {
  const absoluteTarball = resolve(tarballPath);
  const result = await runCommand(["tar", "-xOf", absoluteTarball, "package/package.json"], {
    cwd: dirname(absoluteTarball),
    timeoutMs: 30_000,
    maxOutputBytes: 200_000
  });

  if (result.exitCode !== 0) {
    throw new Error(`Failed to inspect package tarball: ${result.stderr || result.stdout}`);
  }

  const packageJson = JSON.parse(result.stdout) as PackageArtifact["packageJson"];
  if (!packageJson.name) {
    throw new Error("Packed package is missing package.json name.");
  }

  return {
    tarballPath: absoluteTarball,
    packageJson
  };
}

export function getPrimaryBinName(packageJson: PackageArtifact["packageJson"]): string | undefined {
  if (typeof packageJson.bin === "string") {
    return packageJson.name.split("/").pop();
  }
  if (packageJson.bin && typeof packageJson.bin === "object") {
    return Object.keys(packageJson.bin)[0];
  }
  return undefined;
}

