import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

export async function createTempDir(prefix = "packtrial-"): Promise<string> {
  return await mkdtemp(join(tmpdir(), prefix));
}

export async function removeDir(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
}

