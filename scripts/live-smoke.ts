import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const { Agents } = (await import(
  pathToFileURL(path.join(process.cwd(), "packages/agents/dist/index.js")).href
)) as typeof import("../packages/agents/dist/index.js");

const run = promisify(execFile);
const manifest = {
  version: 1 as const,
  project: { name: "live-runtime-smoke" },
  instructions: ["Use the generated project instructions."],
};
const runtimes = [
  ["codex-cli", "codex"],
  ["claude-code", "claude"],
  ["cursor", "cursor"],
  ["hermes", "hermes"],
] as const;
const root = await mkdtemp(path.join(tmpdir(), "agent-compat-live-"));
let failures = 0;

try {
  for (const [id, binary] of runtimes) {
    const compiled = await Agents.compile(manifest, {
      output: root,
      targets: [id],
    });
    const validation = await Agents.validate(root, { targets: [id] });
    const result = (validation.results as Record<string, { status: string }>)[
      id
    ];
    if (!compiled.success || result?.status !== "valid") {
      console.error(`${id}: FAIL generated artifact validation`);
      failures += 1;
      continue;
    }
    try {
      await run(binary, ["--help"], { timeout: 15_000, maxBuffer: 20_000 });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        console.log(`${id}: SKIP (${binary} is not installed)`);
        continue;
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${id}: FAIL runtime startup (${message})`);
      failures += 1;
      continue;
    }
    console.log(`${id}: PASS sandbox compile, validate, and runtime startup`);
  }
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures > 0) process.exitCode = 1;
