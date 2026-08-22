import path from "node:path";
import {
  assertSafeWritePath,
  normalizeManifest,
  renderManifestDocument,
  renderSkillDocument,
  writeManagedFile,
} from "./shared.js";
import { getTargetAdapters } from "./registry.js";
import { detect } from "./detect.js";

function dedupeFiles(files) {
  const byPath = new Map();
  const targetsByPath = new Map();
  for (const file of files) {
    const current = byPath.get(file.path);
    const entry = targetsByPath.get(file.path) ?? {
      targets: new Set(),
      count: 0,
    };
    entry.targets.add(file.target);
    entry.count += 1;
    targetsByPath.set(file.path, entry);
    if (!current || (current.priority ?? 0) < (file.priority ?? 0))
      byPath.set(file.path, file);
  }
  return {
    files: [...byPath.values()],
    collisions: [...targetsByPath.entries()]
      .filter(([, entry]) => entry.count > 1)
      .map(([path, entry]) => ({ path, targets: [...entry.targets] })),
  };
}

export async function compile(manifest, options = {}) {
  const normalized = normalizeManifest(manifest);
  const root = path.resolve(options.output ?? ".");
  const requestedTargets =
    Array.isArray(options.targets) && options.targets.length > 0
      ? [...new Set(options.targets)]
      : (await detect(root)).map((entry) => entry.id);
  const adapters = getTargetAdapters(requestedTargets);
  const deduped = dedupeFiles(
    adapters.flatMap((adapter) => [
      ...adapter.outputs.map((output) => ({
        path: output.path,
        target: adapter.id,
        priority: adapter.priority,
        maxBytes: output.maxBytes,
        content: renderManifestDocument(normalized, adapter, output),
        overwrite: false,
        managed: true,
      })),
      ...(adapter.skillRoot
        ? Object.entries(normalized.skills).map(([name, skill]) => ({
            path: `${adapter.skillRoot}/${name}/SKILL.md`,
            target: adapter.id,
            priority: adapter.priority,
            content: renderSkillDocument(name, skill, adapter),
            overwrite: false,
            managed: true,
          }))
        : []),
    ]),
  );
  const plannedFiles = deduped.files;

  const files = [];
  const errors = [];
  const warnings = deduped.collisions.map(
    ({ path: file, targets }) =>
      `Output collision at ${file}; selected ${targets.join(" over ")}`,
  );
  for (const file of plannedFiles) {
    try {
      await assertSafeWritePath(root, file.path);
      const maxBytes = file.maxBytes;
      if (maxBytes && Buffer.byteLength(file.content, "utf8") > maxBytes) {
        throw new Error(`${file.path} exceeds ${maxBytes} byte limit`);
      }
      const result = options.dryRun
        ? { path: file.path, status: "dry-run" }
        : await writeManagedFile(root, file.path, file.content);
      files.push({ ...file, ...result });
    } catch (error) {
      errors.push({
        target: file.target,
        path: file.path,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const created = files
    .filter((entry) => entry.status === "created")
    .map((entry) => entry.path);
  const updated = files
    .filter((entry) => entry.status === "updated")
    .map((entry) => entry.path);
  const skipped = files
    .filter((entry) => entry.status === "skipped")
    .map((entry) => entry.path);
  return {
    success: errors.length === 0,
    targets: requestedTargets,
    files,
    errors,
    warnings: [
      ...warnings,
      ...skipped.map((file) => `Skipped unmanaged file: ${file}`),
    ],
    created,
    updated,
    skipped,
  };
}
