import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { Agents } from "../src/index.js";

test("detect, compile, validate", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "agents-"));
  await fs.writeFile(path.join(root, "AGENTS.md"), "existing user content\n");

  const detected = await Agents.detect(root);
  assert.ok(detected.length >= 1);

  const result = await Agents.compile(
    {
      version: 1,
      project: {
        name: "demo",
        description: "Demo project",
        stack: ["typescript"],
      },
      instructions: ["Run tests before completion"],
      skills: {
        review: {
          description: "Review boundaries",
          triggers: ["review"],
          instructions: ["Check module seams"],
          tools: ["github"],
        },
      },
      workflows: {
        implementation: {
          description: "Ship safely",
          steps: ["inspect", "plan", "implement", "validate"],
          gates: ["tests"],
        },
      },
      roles: {
        reviewer: {
          description: "Review the diff",
          permissions: ["read", "comment"],
        },
      },
      targets: { auto: true, enabled: ["cursor"], disabled: ["generic"] },
    },
    { output: root, targets: ["cursor"] },
  );

  assert.equal(result.success, true);
  assert.deepEqual(result.created, [".cursor/rules/agents.mdc"]);
  assert.equal(
    await fs.readFile(path.join(root, "AGENTS.md"), "utf8"),
    "existing user content\n",
  );
  const rendered = await fs.readFile(
    path.join(root, ".cursor/rules/agents.mdc"),
    "utf8",
  );
  assert.match(rendered, /agents:begin/);
  assert.match(rendered, /Ship safely/);
  assert.match(rendered, /## Workflows/);
  assert.match(rendered, /## Roles/);

  const report = await Agents.validate(root);
  assert.equal(report.cursor, "✓");
  assert.equal(report.valid, true);
});

test("registers custom adapters", () => {
  assert.equal(Agents.get("missing"), undefined);
  Agents.register({
    id: "custom-tool",
    description: "Custom",
    detect: () => false,
    outputs: ["CUSTOM.md"],
    capabilities: { instructions: true, skills: false, mcp: false },
  });

  assert.ok(Agents.list().some((adapter) => adapter.id === "custom-tool"));
  Agents.reset();
});

test("exposes surface-level adapter identities and metadata", () => {
  const adapters = Agents.list();
  const ids = new Set(adapters.map((adapter) => adapter.id));
  for (const id of [
    "codex-cli",
    "codex-app",
    "claude-code",
    "claude-cli",
    "gemini-cli",
    "gemini-code-assist",
    "antigravity",
    "cursor",
    "windsurf",
    "cline",
    "roo-code",
    "kilo-code",
    "opencode",
    "pi",
    "openclaw",
    "hermes",
    "aider",
    "goose",
    "continue",
    "copilot",
    "junie",
    "zed",
    "generic",
  ]) {
    assert.ok(ids.has(id), id);
  }
  assert.equal(ids.size, adapters.length);
  for (const adapter of adapters) {
    assert.equal(typeof adapter.vendor, "string");
    assert.equal(typeof adapter.product, "string");
    assert.ok(
      ["cli", "ide", "desktop", "cloud", "sdk", "generic"].includes(
        adapter.surface,
      ),
    );
    assert.ok(["native", "portable", "experimental"].includes(adapter.support));
    assert.equal(typeof adapter.capabilities.projectConfig, "boolean");
    assert.equal(adapter.verification?.contract, "verified");
    assert.equal(adapter.verification?.runtime, "unverified");
  }
});

test("supports every built-in adapter from canonical signals", async () => {
  const cases = [
    ["cursor", ".cursor"],
    ["codex-cli", "AGENTS.md"],
    ["claude-code", ".claude"],
    ["pi", ".pi"],
    ["openclaw", ".openclaw"],
    ["hermes", ".hermes"],
    ["copilot", ".github/copilot-instructions.md"],
    ["cline", ".clinerules"],
    ["gemini-cli", "GEMINI.md"],
  ];
  for (const [id, signal] of cases) {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), `agents-${id}-`));
    const signalPath = path.join(root, signal);
    if (
      ![".cursor", ".claude", ".pi", ".openclaw", ".hermes"].includes(signal)
    ) {
      await fs.mkdir(path.dirname(signalPath), { recursive: true });
      await fs.writeFile(signalPath, "existing\n");
    } else await fs.mkdir(signalPath, { recursive: true });
    const detected = await Agents.detect(root);
    assert.equal(detected[0].id, id);
    assert.ok(detected[0].confidence >= 0.55 && detected[0].confidence <= 1);
    await fs.rm(root, { recursive: true, force: true });
  }
  const genericRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "agents-generic-"),
  );
  await fs.writeFile(
    path.join(genericRoot, "AGENTS.md"),
    "user instructions\n",
  );
  const genericDetected = await Agents.detect(genericRoot);
  assert.ok(genericDetected.some((entry) => entry.id === "generic"));
  await fs.rm(genericRoot, { recursive: true, force: true });
});

test("compiles native artifacts for all targets and preserves unmanaged files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "agents-all-"));
  const existing = "user-owned instructions\n";
  await fs.writeFile(path.join(root, "AGENTS.md"), existing);
  const result = await Agents.compile(
    {
      version: 1,
      project: { name: "all-targets" },
      instructions: ["Run tests"],
      skills: {
        review: {
          description: "Review changes",
          instructions: ["Check the diff"],
        },
      },
    },
    {
      root,
      output: root,
      targets: [
        "cursor",
        "codex-cli",
        "claude-code",
        "pi",
        "openclaw",
        "hermes",
        "copilot",
        "cline",
        "gemini-cli",
        "generic",
      ],
    },
  );
  assert.equal(result.success, true);
  assert.deepEqual(
    await fs.readFile(path.join(root, "AGENTS.md"), "utf8"),
    existing,
  );
  for (const file of [
    ".cursor/rules/agents.mdc",
    "CLAUDE.md",
    ".agents/skills/review/SKILL.md",
    ".claude/skills/review/SKILL.md",
    ".pi/skills/review/SKILL.md",
    "skills/review/SKILL.md",
    ".github/copilot-instructions.md",
    ".clinerules",
    "GEMINI.md",
  ]) {
    assert.ok(
      result.files.some((entry) => entry.path === file),
      `planned ${file}`,
    );
    assert.match(
      await fs.readFile(path.join(root, file), "utf8"),
      /agents:begin/,
    );
  }
  assert.match(
    await fs.readFile(path.join(root, ".cursor/rules/agents.mdc"), "utf8"),
    /alwaysApply: true/,
  );
  assert.match(
    await fs.readFile(
      path.join(root, ".claude/skills/review/SKILL.md"),
      "utf8",
    ),
    /name: ["']review["']/,
  );
  assert.match(
    await fs.readFile(path.join(root, "skills/review/SKILL.md"), "utf8"),
    /name: ["']review["']/,
  );
  await fs.rm(path.join(root, "AGENTS.md"));
  await Agents.compile(
    {
      version: 1,
      project: { name: "all-targets" },
      instructions: ["Run tests"],
    },
    { output: root, targets: ["codex-cli"] },
  );
  const report = await Agents.validate(root, {
    targets: [
      "cursor",
      "codex-cli",
      "claude-code",
      "pi",
      "openclaw",
      "hermes",
      "copilot",
      "cline",
      "gemini-cli",
      "generic",
    ],
  });
  for (const id of [
    "cursor",
    "codex-cli",
    "claude-code",
    "pi",
    "openclaw",
    "hermes",
    "copilot",
    "cline",
    "gemini-cli",
    "generic",
  ]) {
    assert.equal(report.results[id].status, "valid", id);
  }
  await fs.rm(root, { recursive: true, force: true });
});

test("dry-run and validation expose real artifact state", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "agents-verify-"));
  const result = await Agents.compile(
    { version: 1, project: { name: "dry-run" }, instructions: [] },
    { output: root, targets: ["cursor"], dryRun: true },
  );
  assert.equal(result.files[0].status, "dry-run");
  await assert.rejects(fs.access(path.join(root, ".cursor")));

  await fs.mkdir(path.join(root, ".cursor/rules"), { recursive: true });
  await fs.writeFile(
    path.join(root, ".cursor/rules/agents.mdc"),
    "<!-- agents:begin -->\n---\ndescription: broken\n---\n<!-- agents:end -->\n",
  );
  const report = await Agents.validate(root);
  assert.equal(report.cursor, "×");
  assert.equal(report.cursorValidation.status, "invalid");
  assert.equal(report.results.cursor.status, "invalid");
  await fs.rm(root, { recursive: true, force: true });
});

test("rejects malformed manifests and unknown targets", async () => {
  await assert.rejects(
    () => Agents.compile({ version: 2 }, { targets: ["cursor"] }),
    /manifest.version/,
  );
  await assert.rejects(
    () =>
      Agents.compile(
        {
          version: 1,
          workflows: { implementation: { steps: "not-an-array" } },
        },
        { targets: ["cursor"] },
      ),
    /workflow implementation\.steps/,
  );
  await assert.rejects(
    () =>
      Agents.compile(
        { version: 1, targets: { auto: "yes" } },
        { targets: ["cursor"] },
      ),
    /manifest\.targets\.auto/,
  );
  await assert.rejects(
    () =>
      Agents.compile(
        { version: 1, roles: { reviewer: { permissions: "read" } } },
        { targets: ["cursor"] },
      ),
    /role reviewer\.permissions/,
  );
  for (const [field, value] of [
    ["skills", []],
    ["workflows", []],
    ["roles", []],
    ["targets", []],
  ]) {
    await assert.rejects(
      () =>
        Agents.compile({ version: 1, [field]: value }, { targets: ["cursor"] }),
      new RegExp(`manifest\\.${field} must be an object`),
    );
  }
  await assert.rejects(
    () =>
      Agents.compile(
        { version: 1, skills: { review: { instructions: ["ok", 1] } } },
        { targets: ["cursor"] },
      ),
    /skill review\.instructions must be an array of strings/,
  );
  await assert.rejects(
    () => Agents.compile({ version: 1 }, { targets: ["missing"] }),
    /Unknown adapter/,
  );
  assert.throws(
    () =>
      Agents.register({ id: "escape", outputs: [{ path: "../outside.md" }] }),
    /stay within/,
  );
  assert.throws(
    () =>
      Agents.register({ id: "absolute", outputs: [{ path: "/outside.md" }] }),
    /stay within/,
  );
  Agents.register({
    id: "duplicate-output",
    outputs: ["DUPLICATE.md", "DUPLICATE.md"],
  });
  const duplicateRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "agents-duplicate-"),
  );
  const duplicateResult = await Agents.compile(
    { version: 1, project: { name: "duplicate" } },
    { output: duplicateRoot, targets: ["duplicate-output"] },
  );
  assert.ok(
    duplicateResult.warnings.some((warning) =>
      warning.includes("DUPLICATE.md"),
    ),
  );
  await fs.rm(duplicateRoot, { recursive: true, force: true });
  Agents.reset();
});

test("rejects generated output that exceeds an adapter limit", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "agents-limit-"));
  const result = await Agents.compile(
    {
      version: 1,
      project: { name: "large" },
      instructions: ["x".repeat(40000)],
    },
    { output: root, targets: ["codex-cli"] },
  );
  assert.equal(result.success, false);
  assert.match(result.errors[0].message, /32768 byte limit/);
  await assert.rejects(fs.access(path.join(root, "AGENTS.md")));
  await fs.rm(root, { recursive: true, force: true });
});

test("scopes validation and reports shared output collisions", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "agents-scope-"));
  await Agents.compile(
    { version: 1, project: { name: "scope" }, instructions: [] },
    { output: root, targets: ["cursor"] },
  );
  const report = await Agents.validate(root, { targets: ["cursor"] });
  assert.deepEqual(report.targets, ["cursor"]);
  assert.equal(report.valid, true);
  assert.equal(report.results.codex, undefined);

  const collision = await Agents.compile(
    { version: 1, project: { name: "collision" }, instructions: [] },
    { output: root, targets: ["codex-cli", "pi"] },
  );
  assert.ok(
    collision.warnings.some((warning) => warning.includes("AGENTS.md")),
  );
  await fs.rm(root, { recursive: true, force: true });
});

test("rejects unsafe skill names, roots, and symlinked writes", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "agents-security-"));
  await assert.rejects(
    () =>
      Agents.compile(
        {
          version: 1,
          project: { name: "unsafe" },
          skills: { "../escape": { description: "bad" } },
        },
        { output: root, targets: ["cursor"] },
      ),
    /invalid skill name/,
  );
  assert.throws(
    () =>
      Agents.register({
        id: "unsafe-root",
        outputs: ["SAFE.md"],
        skillRoot: "../escape",
      }),
    /skillRoot must stay within/,
  );

  const outside = await fs.mkdtemp(path.join(os.tmpdir(), "agents-outside-"));
  await fs.symlink(outside, path.join(root, ".cursor"));
  const result = await Agents.compile(
    { version: 1, project: { name: "symlink" }, instructions: [] },
    { output: root, targets: ["cursor"] },
  );
  assert.equal(result.success, false);
  await assert.rejects(fs.access(path.join(outside, "rules/agents.mdc")));
  await fs.rm(root, { recursive: true, force: true });
  await fs.rm(outside, { recursive: true, force: true });
});

test("serializes concurrent managed writes", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "agents-race-"));
  await Promise.all(
    ["first", "second"].map((name) =>
      Agents.compile(
        { version: 1, project: { name }, instructions: ["Run tests"] },
        { output: root, targets: ["cursor"] },
      ),
    ),
  );
  const content = await fs.readFile(
    path.join(root, ".cursor/rules/agents.mdc"),
    "utf8",
  );
  assert.match(content, /agents:begin/);
  assert.match(content, /agents:end/);
  assert.match(content, /# (first|second)/);
  await fs.rm(root, { recursive: true, force: true });
});
