import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { Agents } from "../src/index.js";
import { verifyAdapter } from "../src/testing/index.js";

test("every registered adapter passes compile/write/read/validate conformance", async (t) => {
  const manifest = {
    version: 1,
    project: { name: "adapter-conformance" },
    instructions: ["Run the verification suite"],
    skills: {
      verification: {
        description: "Verify generated integration artifacts",
        instructions: ["Inspect generated files"],
      },
    },
  };

  for (const adapter of Agents.list()) {
    await t.test(`${adapter.id} (${adapter.vendor})`, async () => {
      const root = await fs.mkdtemp(
        path.join(os.tmpdir(), `agent-compat-${adapter.id}-`),
      );
      try {
        const result = await verifyAdapter(adapter, { root, manifest });
        assert.equal(result.passed, true, JSON.stringify(result));
      } finally {
        await fs.rm(root, { recursive: true, force: true });
      }
    });
  }
});
