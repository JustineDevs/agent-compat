# Support Matrix

This is the release-gate record for `@jstn-sdk/agents`.

## Current Findings

| Finding | Result | Release impact |
| --- | --- | --- |
| Registered adapter surfaces | 41 | All are included in conformance coverage |
| Vendor labels | 26 | Counted by `adapter.vendor`, not product surface |
| Filesystem conformance | 41/41 passed | SDK compile/write/read/validate contract proven |
| Native support profiles | 6 | Native artifact contracts are covered by tests |
| Portable support profiles | 35 | Portable output only; native vendor behavior is not claimed |
| Live runtime E2E verification | 0/41 | Optional host-specific evidence; not the SDK contract gate |
| Runtime startup smoke | 12/41 passed | Installed runtimes plus temporary npm/Python installs for Gemini CLI, Pi, OpenCode, `llm`, Fabric, Amp, Kilo Code, and gptme |
| Public package metadata | Complete | Scoped package public access is configured |
| Semantic npm release | Configured | Semantic-release publishes npm, tags `v${version}`, and generates GitHub release notes |
| GitHub Release package asset | Configured | The exact npm tarball is attached to each GitHub Release |
| GitHub Packages registry | Blocked by namespace | `@jstn-sdk/agents` requires a GitHub `jstn-sdk` user or organization namespace; no public `jstn-sdk` organization is available |
| Meta-Architect integration | Contract-ready | Integrate after pinning the published package version |

## Adapter Matrix

`Filesystem` means `pnpm verify` passed the adapter's declared output contract.
`Runtime` records optional local availability only. Runtime evidence is not
required for every adapter because IDE, desktop, cloud, and SDK surfaces do not
share one executable host contract.

| Adapter | Vendor | Surface | Support | Filesystem | Runtime | Runtime evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `cursor` | cursor | ide | native | PASS | startup smoke passed in sandbox | blocked |
| `codex-cli` | openai | cli | native | PASS | startup smoke passed in sandbox | blocked |
| `claude-code` | anthropic | cli | native | PASS | startup smoke passed in sandbox | blocked |
| `gemini-cli` | google | cli | native | PASS | temporary npm startup smoke passed | blocked |
| `pi` | independent | cli | portable | PASS | temporary npm startup smoke passed | blocked |
| `openclaw` | openclaw | cli | portable | PASS | not installed | blocked |
| `hermes` | hermes | cli | portable | PASS | startup smoke passed in sandbox | blocked |
| `copilot` | github | ide | native | PASS | not installed | blocked |
| `cline` | cline | ide | native | PASS | not installed | blocked |
| `codex-app` | openai | desktop | portable | PASS | not installed | blocked |
| `openai-agents` | openai | sdk | portable | PASS | not installed | blocked |
| `chatgpt-canvas` | openai | cloud | portable | PASS | not installed | blocked |
| `claude-cli` | anthropic | cli | portable | PASS | not installed | blocked |
| `claude-desktop` | anthropic | desktop | portable | PASS | not installed | blocked |
| `anthropic-sdk` | anthropic | sdk | portable | PASS | not installed | blocked |
| `gemini-code-assist` | google | ide | portable | PASS | not installed | blocked |
| `antigravity` | google | ide | portable | PASS | not installed | blocked |
| `google-jules` | google | cloud | portable | PASS | not installed | blocked |
| `firebase-studio` | google | cloud | portable | PASS | not installed | blocked |
| `windsurf` | codeium | ide | portable | PASS | not installed | blocked |
| `zed` | zed | ide | portable | PASS | not installed | blocked |
| `continue` | continue | ide | portable | PASS | not installed | blocked |
| `copilot-vscode` | github | ide | portable | PASS | not installed | blocked |
| `copilot-jetbrains` | github | ide | portable | PASS | not installed | blocked |
| `junie` | jetbrains | ide | portable | PASS | not installed | blocked |
| `opencode` | opencode | cli | portable | PASS | temporary npm startup smoke passed | blocked |
| `aider` | aider | cli | portable | PASS | not installed | blocked |
| `goose` | block | cli | portable | PASS | not installed | blocked |
| `amp` | sourcegraph | cli | portable | PASS | temporary npm startup smoke passed | blocked |
| `warp` | warp | cli | portable | PASS | not installed | blocked |
| `gptme` | gptme | cli | portable | PASS | temporary Python venv startup smoke passed | blocked |
| `llm` | independent | cli | portable | PASS | temporary npm startup smoke passed | blocked |
| `fabric` | independent | cli | portable | PASS | temporary npm startup smoke passed | blocked |
| `roo-code` | roo | ide | portable | PASS | not installed | blocked |
| `kilo-code` | kilo | ide | portable | PASS | temporary npm startup smoke passed | blocked |
| `amazon-q` | amazon | ide | portable | PASS | not installed | blocked |
| `tabnine` | tabnine | ide | portable | PASS | not installed | blocked |
| `sourcegraph-cody` | sourcegraph | ide | portable | PASS | not installed | blocked |
| `augment-code` | augment | ide | portable | PASS | not installed | blocked |
| `void` | void | ide | portable | PASS | not installed | blocked |
| `generic` | agnostic | generic | portable | PASS | not installed | blocked |

## Release Gate

Publish `0.1.0` as a production SDK contract when:

1. The package declares public scoped-package access.
2. Every adapter passes the shared compile/write/read/validate conformance suite.
3. The support matrix drift check passes.
4. Native support claims have documentation URLs and native artifact validation.
5. Runtime smoke is additive evidence, reported when a host is available.
6. Meta-Architect consumes the published version through its package contract.

GitHub Releases are synchronized by semantic-release. The GitHub Packages page
is a separate registry: it cannot receive `@jstn-sdk/agents` unless the
`jstn-sdk` scope belongs to a GitHub account or organization. The npm package
and exact tarball remain linked from each GitHub Release until that namespace
exists or the package is intentionally renamed to `@justinedevs/agents`.

Current status: **SDK contract production-ready; runtime evidence is additive and partial by host availability**.
