# Contributing to Agent Compat

Thanks for helping improve `@jstn-sdk/agents`.

## Before opening a pull request

```bash
pnpm install
pnpm check
pnpm lint
```

Adapter changes must include conformance coverage and an update to
`docs/support-matrix.md`. Keep native behavior tied to official documentation
or a reproducible installation; use `portable` support when native behavior is
not verified.

## Pull requests

Describe the user-facing contract, affected adapter surfaces, and verification
evidence. Keep changes focused and do not modify generated artifacts or
managed files in fixture projects unless the test requires it.

## Security

Do not disclose vulnerabilities in public issues. Follow
[`SECURITY.md`](./SECURITY.md) for private reporting.
