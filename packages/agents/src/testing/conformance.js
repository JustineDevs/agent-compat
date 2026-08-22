import { compile } from "../compile.js";
import { validate } from "../validate.js";

export async function verifyAdapter(adapter, { root, manifest }) {
  const compiled = await compile(manifest, {
    output: root,
    targets: [adapter.id],
  });
  const report = await validate(root, { targets: [adapter.id] });
  const validation = report.results[adapter.id];
  const missing = compiled.files.filter((file) => file.status !== "created");

  return {
    adapter: adapter.id,
    vendor: adapter.vendor,
    compile: compiled.success,
    validation: validation?.status ?? "unknown",
    files: compiled.files.map((file) => file.path),
    missing: missing.map((file) => file.path),
    passed:
      compiled.success &&
      missing.length === 0 &&
      validation?.status === "valid",
  };
}
