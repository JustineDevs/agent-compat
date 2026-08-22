import { builtInAdapters, getBuiltInAdapter } from "./adapters/index.js";
import path from "node:path";

const registry = new Map(
  builtInAdapters.map((adapter) => [adapter.id, adapter]),
);

export function listAdapters() {
  return [...registry.values()];
}

export function registerAdapter(adapter) {
  if (!adapter || typeof adapter !== "object") {
    throw new TypeError("adapter must be an object");
  }
  if (typeof adapter.id !== "string" || adapter.id.trim() === "") {
    throw new TypeError("adapter.id must be a non-empty string");
  }
  if (registry.has(adapter.id)) {
    throw new Error(`Adapter "${adapter.id}" is already registered`);
  }
  if (!Array.isArray(adapter.outputs) || adapter.outputs.length === 0) {
    throw new TypeError("adapter.outputs must be a non-empty array");
  }
  adapter.outputs = adapter.outputs.map((output) =>
    typeof output === "string" ? { path: output, format: "document" } : output,
  );
  for (const output of adapter.outputs) {
    if (
      !output ||
      typeof output.path !== "string" ||
      output.path.length === 0
    ) {
      throw new TypeError("adapter.outputs entries must include a path");
    }
    if (
      path.isAbsolute(output.path) ||
      output.path.split(/[\\/]+/).includes("..")
    ) {
      throw new TypeError(
        `adapter output path must stay within the project: ${output.path}`,
      );
    }
  }
  if (adapter.skillRoot !== undefined) {
    if (
      typeof adapter.skillRoot !== "string" ||
      adapter.skillRoot.length === 0 ||
      path.isAbsolute(adapter.skillRoot) ||
      adapter.skillRoot.split(/[\\/]+/).includes("..")
    ) {
      throw new TypeError(
        `adapter skillRoot must stay within the project: ${adapter.skillRoot}`,
      );
    }
  }
  registry.set(adapter.id, adapter);
  return adapter;
}

export function getAdapter(id) {
  return registry.get(id) ?? getBuiltInAdapter(id) ?? undefined;
}

export function resetRegistry() {
  registry.clear();
  for (const adapter of builtInAdapters) {
    registry.set(adapter.id, adapter);
  }
}

export function getTargetAdapters(targets) {
  const ids =
    Array.isArray(targets) && targets.length > 0 ? targets : ["generic"];
  return ids.map((id) => {
    const adapter = getAdapter(id);
    if (!adapter) {
      throw new Error(`Unknown adapter: ${id}`);
    }
    return adapter;
  });
}
