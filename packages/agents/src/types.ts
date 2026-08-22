export type Surface = "cli" | "ide" | "desktop" | "cloud" | "sdk" | "generic";
export type SupportLevel = "native" | "portable" | "experimental";
export type ValidationStatus = "valid" | "partial" | "invalid" | "unknown";

export interface Manifest {
  version: 1;
  project?: { name?: string; description?: string; stack?: string[] };
  instructions?: string[];
  skills?: Record<string, Skill>;
  workflows?: Record<string, Workflow>;
  roles?: Record<string, Role>;
  targets?: Targets;
}

export interface Skill {
  description?: string;
  instructions?: string[];
  triggers?: string[];
  tools?: string[];
}

export interface Workflow {
  description?: string;
  steps?: string[];
  gates?: string[];
}

export interface Role {
  description?: string;
  permissions?: string[];
}

export interface Targets {
  auto?: boolean;
  enabled?: string[];
  disabled?: string[];
}

export interface CompileOptions {
  targets?: string[];
  output?: string;
  dryRun?: boolean;
}

export interface AdapterOutput {
  path: string;
  format?: string;
  maxBytes?: number;
}

export interface Adapter {
  id: string;
  vendor?: string;
  product?: string;
  surface?: Surface;
  description?: string;
  support?: SupportLevel;
  verification?: { contract: "verified" | "unverified"; runtime: string };
  signals?: Array<{ type: string; path: string }>;
  outputs: Array<string | AdapterOutput>;
  skillRoot?: string;
  priority?: number;
  capabilities?: Record<string, boolean>;
}

export interface ValidationOptions {
  targets?: string[];
}
