import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { Agents } = (await import(
  pathToFileURL(join(process.cwd(), "packages/agents/dist/index.js")).href
)) as typeof import("../packages/agents/dist/index.js");

const matrix = await readFile("docs/support-matrix.md", "utf8");
const adapters = Agents.list();
const missing = adapters.filter(
  (adapter) => !matrix.includes(`| \`${adapter.id}\` |`),
);
const vendors = new Set(adapters.map((adapter) => adapter.vendor));

if (missing.length > 0) {
  throw new Error(
    `Support matrix is missing: ${missing.map((adapter) => adapter.id).join(", ")}`,
  );
}

if (!matrix.includes(`| Registered adapter surfaces | ${adapters.length} |`)) {
  throw new Error("Support matrix adapter count is stale");
}
if (!matrix.includes(`| Vendor labels | ${vendors.size} |`)) {
  throw new Error("Support matrix vendor count is stale");
}

console.log(
  `support matrix: ${adapters.length} adapters, ${vendors.size} vendors`,
);
