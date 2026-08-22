<div align="center">
  <img src="./public/assets/banner.png" alt="agents" width="800"/>
  
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
| **Targets** | 30+ tools | Surface-level adapters + community adapters |

---

## Prerequisites

- Node.js 18+
- npm, pnpm, or yarn

## Development Toolchain

The workspace installs and verifies the project tooling explicitly:

```bash
pnpm install
pnpm check
```

- [Nx](https://github.com/nrwl/nx) for workspace orchestration
- [Biome](https://github.com/biomejs/biome) for formatting and linting
- [Knip](https://github.com/webpro-nl/knip) for unused-code checks
- [fzf](https://github.com/junegunn/fzf) for terminal workflows
- [Changesets](https://github.com/changesets/changesets) for package versioning
- [semantic-release](https://github.com/semantic-release/semantic-release) for automated publishing
- [Fumadocs](https://github.com/fuma-nama/fumadocs) for documentation tooling
- [Portless](https://github.com/vercel-labs/portless) for local development ports
- `zod` and `@trpc/server` / `@trpc/client` for typed contracts

On Ubuntu CI, `fzf` is installed with `sudo apt-get install --yes fzf`. On macOS, use `brew install fzf`.

---

## Installation & Setup

```bash
npm install @jstn-sdk/agents
```

Publish the public SDK package from the workspace root with:

```bash
pnpm publish:agents
```

The private `agent-compat` workspace root is not publishable; only
`packages/agents` publishes as `@jstn-sdk/agents`.

```typescript
import { Agents } from "@jstn-sdk/agents";
```

---

## How It Works

### 1. Detect

Automatically discovers which agent environments are present in a project:

```typescript
const detected = await Agents.detect("./my-project");
// → [{ id: "cursor", confidence: 0.95 }, { id: "codex-cli", confidence: 0.92 }]
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
  targets: ["cursor", "codex-cli", "pi"],
  output: "./my-project"
});
// → { files: [".cursor/rules/agents.mdc", "AGENTS.md", ".pi/skills/review/SKILL.md"] }
```

### 3. Validate

Checks generated files against official specifications:

```typescript
const report = await Agents.validate("./my-project");
// → { cursor: "✓", "codex-cli": "✓", pi: "◐", summary: { ... } }
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

## Surface-Level Adapters

| Adapter family | Surface IDs | Support |
|---|---|---|
| OpenAI | `codex-cli`, `codex-app`, `openai-agents`, `chatgpt-canvas` | native / experimental |
| Anthropic | `claude-code`, `claude-cli`, `claude-desktop`, `anthropic-sdk` | native / portable / experimental |
| Google | `gemini-cli`, `gemini-code-assist`, `antigravity`, `google-jules`, `firebase-studio` | native / experimental |
| IDE agents | `cursor`, `windsurf`, `zed`, `continue`, `copilot`, `copilot-vscode`, `copilot-jetbrains`, `junie` | native / portable / experimental |
| Terminal agents | `opencode`, `pi`, `openclaw`, `hermes`, `aider`, `goose`, `amp`, `warp`, `gptme`, `llm`, `fabric` | portable / experimental |
| Editor extensions | `cline`, `roo-code`, `kilo-code`, `amazon-q`, `tabnine`, `sourcegraph-cody`, `augment-code`, `void` | native / portable / experimental |
| Generic | `generic` | portable |

Each adapter exposes `vendor`, `product`, `surface`, `support`, `verifiedVersions`, `lastVerifiedAt`, and a full capability profile. Experimental adapters intentionally compile portable output until their native format is verified from official documentation or a real installation.

---

## Plugin Registry

Register custom adapters:

```typescript
import { Agents } from "@jstn-sdk/agents";

const myAdapter = {
  id: "my-tool",
  description: "My tool",
  signals: [{ type: "file", path: "MY-TOOL.md" }],
  outputs: [{ path: "MY-TOOL.md", format: "document" }],
  capabilities: { instructions: true, skills: false, mcp: false },
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
if (!report.valid) {
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
2. Add an adapter definition to `packages/agents/src/adapters/index.js`:

```js
const myToolAdapter = {
  id: "my-tool",
  description: "My tool",
  signals: [{ type: "file", path: "MY-TOOL.md" }],
  outputs: [{ path: "MY-TOOL.md", format: "document" }],
  capabilities: {
    instructions: true,
    skills: false,
    mcp: false,
  },
};
```

3. Add conformance tests in `packages/agents/test/`
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
