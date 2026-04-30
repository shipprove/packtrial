#!/usr/bin/env node
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const outputDir = resolve(root, ".packtrial", "dogfood");
await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await run("pnpm", ["build"], root);

const pack = await run("npm", ["pack", "--json", "--pack-destination", outputDir], root);
const [{ filename }] = JSON.parse(pack.stdout);
if (!filename) {
  throw new Error("npm pack did not return a filename.");
}

await run(
  process.execPath,
  [
    "dist/cli/index.js",
    "run",
    "--package",
    resolve(outputDir, filename),
    "--pm",
    "npm,pnpm",
    "--template",
    "node-esm,ts-bundler,cli-basic",
    "--cli-command",
    "packtrial --help",
    "--out-dir",
    outputDir
  ],
  root
);

console.log("PackTrial dogfood passed.");

function run(command, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      process.stderr.write(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr });
      } else {
        reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
      }
    });
  });
}

