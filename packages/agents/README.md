<div align="center">
  <img src="./public/assets/banner.png" alt="agents" width="800"/>

> Cross-agent environment compatibility SDK - detect, compile, validate

[![npm version](https://img.shields.io/npm/v/@jstn-sdk/agents)](https://www.npmjs.com/package/@jstn-sdk/agents)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

> [!NOTE]
> **agents** is a pure SDK, not a CLI. Use it from your own tools, CI jobs, or a companion CLI.

See the [support matrix](../../docs/support-matrix.md) for release evidence and production gates.

## Install

```bash
npm install @jstn-sdk/agents
```

```js
import { Agents } from "@jstn-sdk/agents";
```

## API

- `Agents.detect(root)`
- `Agents.compile(manifest, { targets, output })`
- `Agents.validate(root, { targets })`
- `Agents.register(adapter)`

The reusable conformance helper is available without pulling in test-runner
dependencies:

```js
import { verifyAdapter } from "@jstn-sdk/agents/testing";

const result = await verifyAdapter(adapter, { root, manifest });
```

It verifies the adapter contract by compiling, reading back, and validating
generated artifacts. Runtime startup evidence is tracked separately.

### Canonical manifest

```yaml
version: 1
project:
  name: my-app
  stack: [typescript, nextjs]
instructions:
  - Read docs/architecture before cross-module changes
skills:
  architecture-review:
    description: Review boundaries and ADR impact
    triggers: [architecture, refactor]
    instructions:
      - Review boundaries
workflows:
  implementation:
    steps: [inspect, plan, implement, validate]
roles:
  reviewer:
    description: Review the diff
```

`Agents.compile()` returns `success`, `files`, `errors`, `warnings`, and convenience lists for created, updated, and skipped files. `Agents.validate()` validates detected targets by default or only the explicit `targets`, then returns a structured report with per-target shortcuts like `report.cursor`.

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm verify
```

`pnpm verify` runs the compile/write/read/validate conformance harness against
all registered adapter surfaces in isolated temporary projects. It verifies
the SDK filesystem contract, not that every proprietary, cloud, or desktop
vendor executable is installed and running locally.

## Surface-level adapters

Adapters identify a concrete product surface, not only a vendor. The registry includes `codex-cli` and `codex-app` separately, for example, while allowing them to share implementation.

- OpenAI: `codex-cli`, `codex-app`, `openai-agents`, `chatgpt-canvas`
- Anthropic: `claude-code`, `claude-cli`, `claude-desktop`, `anthropic-sdk`
- Google: `gemini-cli`, `gemini-code-assist`, `antigravity`, `google-jules`, `firebase-studio`
- IDE: `cursor`, `windsurf`, `zed`, `continue`, `copilot`, `copilot-vscode`, `copilot-jetbrains`, `junie`
- Terminal: `opencode`, `pi`, `openclaw`, `hermes`, `aider`, `goose`, `amp`, `warp`, `gptme`, `llm`, `fabric`
- Extensions: `cline`, `roo-code`, `kilo-code`, `amazon-q`, `tabnine`, `sourcegraph-cody`, `augment-code`, `void`
- Generic: `generic`

Support is explicit: `native` means documented native output, `portable` means
portable instruction/skill output, and `experimental` means the adapter exists
without a verified native contract. The conformance harness currently covers
41 adapter surfaces across 26 vendor labels: 6 native and 35 portable. Live
vendor-process verification is a separate environment-specific concern and is
not inferred from filesystem conformance.
