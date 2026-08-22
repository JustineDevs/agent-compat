import type { Adapter, Manifest } from "../index.d.ts";

export interface ConformanceResult {
  adapter: string;
  vendor?: string;
  compile: boolean;
  validation: "valid" | "partial" | "invalid" | "unknown";
  files: string[];
  missing: string[];
  passed: boolean;
}

export function verifyAdapter(
  adapter: Adapter,
  options: { root: string; manifest: Manifest },
): Promise<ConformanceResult>;
