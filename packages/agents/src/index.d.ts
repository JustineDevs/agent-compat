export type Surface = "cli" | "ide" | "desktop" | "cloud" | "sdk" | "generic";
export type SupportLevel = "native" | "portable" | "experimental";
export type ValidationStatus = "valid" | "partial" | "invalid" | "unknown";
export type RuntimeVerification = "verified" | "unverified" | "not-applicable";

export interface Manifest {
  version: 1;
  project?: { name?: string; description?: string; stack?: string[] };
  instructions?: string[];
  skills?: Record<string, Skill>;
  workflows?: Record<string, unknown>;
  roles?: Record<string, unknown>;
  targets?: Record<string, unknown>;
}

export interface Skill {
  description?: string;
  instructions?: string[];
  triggers?: string[];
  tools?: string[];
}

export interface Adapter {
  id: string;
  vendor?: string;
  product?: string;
  surface?: Surface;
  description?: string;
  support?: SupportLevel;
  verification?: {
    contract: "verified" | "unverified";
    runtime: RuntimeVerification;
  };
  signals?: Array<{ type: string; path: string }>;
  outputs: Array<string | { path: string; format?: string; maxBytes?: number }>;
  skillRoot?: string;
  priority?: number;
  capabilities?: Record<string, boolean>;
}

export interface DetectionResult {
  id: string;
  confidence: number;
  description?: string;
  signals: Array<{ type: string; path: string }>;
}

export interface CompileOptions {
  targets?: string[];
  output?: string;
  dryRun?: boolean;
}

export interface CompileResult {
  success: boolean;
  targets: string[];
  files: Array<Record<string, unknown>>;
  errors: Array<Record<string, unknown>>;
  warnings: string[];
  created: string[];
  updated: string[];
  skipped: string[];
}

export interface ValidateOptions {
  targets?: string[];
}

export interface ValidationResult {
  status: ValidationStatus;
  score: number;
  issues: Array<{ severity: string; message: string }>;
  capabilities: Record<string, string>;
}

export interface ValidationReport {
  valid: boolean;
  targets: string[];
  results: Record<string, ValidationResult>;
  summary: {
    total: number;
    valid: number;
    partial: number;
    invalid: number;
    unknown: number;
  };
  [key: string]: unknown;
}

export const Agents: {
  detect(root?: string): Promise<DetectionResult[]>;
  compile(manifest: Manifest, options?: CompileOptions): Promise<CompileResult>;
  validate(root?: string, options?: ValidateOptions): Promise<ValidationReport>;
  register(adapter: Adapter): Adapter;
  list(): Adapter[];
  get(id: string): Adapter | undefined;
  reset(): void;
};

export function register(adapter: Adapter): Adapter;
export function listAdapters(): Adapter[];
export function getAdapter(id: string): Adapter | undefined;
export function resetRegistry(): void;
