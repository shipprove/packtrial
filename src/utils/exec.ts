import { spawn } from "node:child_process";

export type ExecResult = {
  command: string[];
  exitCode: number | undefined;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  truncated: boolean;
  originalOutputBytes: number;
};

export type ExecOptions = {
  cwd: string;
  timeoutMs: number;
  maxOutputBytes: number;
  env?: NodeJS.ProcessEnv;
};

export async function runCommand(command: string[], options: ExecOptions): Promise<ExecResult> {
  const startedAt = Date.now();
  const [file, ...args] = command;
  if (!file) {
    throw new Error("Command cannot be empty.");
  }

  return await new Promise<ExecResult>((resolve, reject) => {
    const child = spawn(file, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...options.env
      },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, options.timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      const stdout = Buffer.concat(stdoutChunks);
      const stderr = Buffer.concat(stderrChunks);
      const combinedBytes = stdout.byteLength + stderr.byteLength;
      const truncated = combinedBytes > options.maxOutputBytes;
      const budget = Math.floor(options.maxOutputBytes / 2);

      resolve({
        command,
        exitCode: exitCode ?? undefined,
        stdout: truncateBuffer(stdout, budget),
        stderr: truncateBuffer(stderr, budget),
        durationMs: Date.now() - startedAt,
        timedOut,
        truncated,
        originalOutputBytes: combinedBytes
      });
    });
  });
}

function truncateBuffer(buffer: Buffer, maxBytes: number): string {
  if (buffer.byteLength <= maxBytes) {
    return buffer.toString("utf8");
  }
  const half = Math.floor(maxBytes / 2);
  const head = buffer.subarray(0, half).toString("utf8");
  const tail = buffer.subarray(buffer.byteLength - half).toString("utf8");
  return `${head}\n[...truncated...]\n${tail}`;
}

