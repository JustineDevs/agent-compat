import fs from "node:fs/promises";
import path from "node:path";
import { normalizeRoot } from "./shared.js";
import { listAdapters } from "./registry.js";

async function signalExists(root, signal) {
  try {
    const target = path.join(root, signal.path);
    const stat = await fs.stat(target);
    return signal.type === "directory" ? stat.isDirectory() : stat.isFile();
  } catch {
    return false;
  }
}

export async function detect(root = ".") {
  const absoluteRoot = normalizeRoot(root);
  const results: any[] = [];

  for (const adapter of listAdapters()) {
    if (adapter.id === "generic") continue;
    const signals: any[] = [];
    for (const signal of adapter.signals ?? []) {
      if (await signalExists(absoluteRoot, signal)) signals.push(signal);
    }
    if (signals.length > 0) {
      const confidence = Math.min(1, 0.55 + signals.length * 0.15);
      results.push({
        id: adapter.id,
        confidence,
        description: adapter.description,
        signals,
      });
    }
  }

  const generic = listAdapters().find((adapter) => adapter.id === "generic");
  const genericSignals =
    generic &&
    (
      await Promise.all(
        (generic.signals ?? []).map((signal) =>
          signalExists(absoluteRoot, signal),
        ),
      )
    )
      .map((exists, index) => (exists ? generic.signals[index] : null))
      .filter(Boolean);
  if (generic && genericSignals.length > 0) {
    results.push({
      id: "generic",
      confidence: 0.35,
      description: generic.description,
      signals: genericSignals,
    });
  }
  if (results.length === 0) {
    results.push({
      id: "generic",
      confidence: 0.1,
      description: generic?.description,
      signals: genericSignals ?? [],
    });
  }

  return results.sort(
    (a, b) => b.confidence - a.confidence || a.id.localeCompare(b.id),
  );
}
