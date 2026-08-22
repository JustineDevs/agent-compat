<div align="center">
  <img src="./public/img/assets/banner.png" alt="agents" width="800"/>
  
> Cross-agent environment compatibility SDK — detect, compile, validate
  
[![npm version](https://img.shields.io/npm/v/@jstn-sdk/agents)](https://www.npmjs.com/package/@jstn-sdk/agents)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

> [!NOTE]
> **agents** is a pure SDK (library), not a CLI. It provides programmatic APIs for detecting agent environments, compiling manifests to native files, and validating generated output. Embed it in your own tools, CI pipelines, or use the companion CLI for a ready-to-use command-line experience.

---

## Difference

| Feature | [rulesync](https://github.com/dyoshikawa/rulesync) | agents |
|---|---|---|
| **Form factor** | CLI tool | Pure SDK (library) |
| **Detection** | Manual `--targets` flag | Automatic environment detection |
| **Validation** | `--check` flag for drift | First-class `validate()` API against specs |
| **Plugin system** | Built-in adapters only | Open adapter registry for community |
| **Focus** | Rule/config file sync | Development cycle compatibility |
| **Integration** | Standalone tool | Embeddable in any tool |
| **Output** | Tool-specific files | Native files + validation report |
| **Import** | `rulesync import` | Not included (compile-only) |
| **Targets** | 30+ tools | 10 built-in + community adapters |

---

## Prerequisites

- Node.js 18+
- npm, pnpm, or yarn

---

## Installation & Setup

```bash
npm install @jstn-sdk/agents
```

```typescript
import { Agents } from "@jstn-sdk/agents";
```

---

## How It Works

### 1. Detect

Automatically discovers which agent environments are present in a project:

```typescript
const detected = await Agents.detect("./my-project");
// → [{ id: "cursor", confidence: 0.95 }, { id: "codex", confidence: 0.92 }]
```

### 2. Compile

Transforms a canonical manifest into native files for each environment:

```typescript
const manifest = {
  version: 1,
  project: { name: "my-app", stack: ["typescript"] },
  instructions: ["Run tests before completion"],
  skills: { "code-review": { description: "Review PRs" } }
};

const result = await Agents.compile(manifest, {
  targets: ["cursor", "codex", "pi"],
  output: "./my-project"
});
// → { files: [".cursor/rules/agents.mdc", "AGENTS.md", ".pi/agents.md"] }
```

### 3. Validate

Checks generated files against official specifications:

```typescript
const report = await Agents.validate("./my-project");
// → { cursor: "✓", codex: "✓", pi: "◐ (partial: no hooks support)" }
```

---

## Architecture

```
agents/
├── detect()     ← Environment detection
├── compile()    ← Manifest → native files
├── validate()   ← Spec compliance check
└── registry     ← Plugin adapter system
```

---

## Built-in Adapters

| Adapter | Target | Capabilities |
|---|---|---|
| `cursor` | Cursor IDE | rules, MCP, scoped rules |
| `codex` | OpenAI Codex CLI | AGENTS.md, nested instructions |
| `claude-code` | Claude Code | CLAUDE.md, skills, hooks |
| `pi` | Pi Coding Agent | AGENTS.md, CLAUDE.md |
| `openclaw` | OpenClaw | AGENTS.md, skills, MCP |
| `hermes` | Hermes Agent | AGENTS.md, workspace config |
| `copilot` | GitHub Copilot | instructions, agents |
| `cline` | Cline / Roo Code | rules, MCP |
| `gemini` | Gemini CLI | GEMINI.md, extensions |
| `generic` | Any AGENTS.md reader | AGENTS.md baseline |

---

## Plugin Registry

Register custom adapters:

```typescript
import { Agents, Adapter } from "@jstn-sdk/agents";

const myAdapter: Adapter = {
  id: "my-tool",
  detect: (root) => /* ... */,
  capabilities: { instructions: true, skills: false },
  compile: (manifest) => /* ... */
};

Agents.register(myAdapter);
```

---

## Case Studies

### [Meta-Architect](https://github.com/JustineDevs/meta-architect)

Meta-Architect uses `agents` as its core compatibility layer. When users run `npx @jstn-sdk/ma@latest init`, Meta-Architect calls `Agents.detect()` to discover installed environments, then `Agents.compile()` to generate native files for Cursor, Codex, Pi, OpenClaw, and other detected tools.

This allows Meta-Architect to focus on development workflow opinions (skills, gates, traceability) while delegating cross-agent compatibility to `agents`.

### Custom CI Pipeline

A team embeds `agents` in their CI to validate that generated agent configurations match official specs before merging:

```typescript
const report = await Agents.validate("./");
if (report.hasErrors()) {
  process.exit(1);
}
```

### VS Code Extension

An extension uses `agents` to show real-time compatibility status as developers edit their `agents.yaml` manifest, highlighting which environments will receive full vs. partial support.

---

## Contributing

Contributions are welcome — especially new adapters.

### Adding an Adapter

1. Fork the repository
2. Create `src/adapters/<your-tool>.ts`:

```typescript
import type { Adapter } from "../types";

export const myToolAdapter: Adapter = {
  id: "my-tool",
  detect: (root) => {
    // Return DetectionResult or null
  },
  capabilities: {
    instructions: true,
    skills: false,
    mcp: false,
  },
  compile: (manifest, options) => {
    // Return GeneratedFile[]
  },
};
```

3. Add conformance tests in `tests/adapters/<your-tool>.test.ts`
4. Update the Built-in Adapters table in this README
5. Open a pull request

### Development

```bash
git clone https://github.com/JustineDevs/agent-compat.git
cd agent-compat
pnpm install
pnpm build
pnpm test
```

---

## Links

- [Documentation](https://agents.jstn.site)
- [npm](https://www.npmjs.com/package/@jstn-sdk/agents)
- [Issues](https://github.com/JustineDevs/agent-compat/issues)
- [Changelog](./CHANGELOG.md)

<div align="center">

## License
MIT © [justinedevs](https://github.com/justinedevs)

</div>

<div align="center">
  <sub>Built by <a href="https://github.com/justinedevs">justinedevs</a> · Part of the <a href="https://www.npmjs.com/org/jstn-sdk">jstn-sdk</a> ecosystem</sub>
</div>
