#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const actionDir = dirname(fileURLToPath(import.meta.url));
const cliPath = resolve(actionDir, "../dist/cli/index.js");

const args = ["run"];
addOption(args, "--package", process.env.INPUT_PACKAGE);
addOption(args, "--pm", process.env.INPUT_PACKAGE_MANAGERS);
addOption(args, "--template", process.env.INPUT_TEMPLATES);
addOption(args, "--fail-on", process.env.INPUT_FAIL_ON);
addOption(args, "--keep-workdir", process.env.INPUT_KEEP_WORKDIR);

const child = spawn(process.execPath, [cliPath, ...args], {
  stdio: "inherit",
  shell: false
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

function addOption(args, name, value) {
  if (value) {
    args.push(name, value);
  }
}

