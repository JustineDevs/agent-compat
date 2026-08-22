const fullCapabilities = {
  agentsMd: false,
  instructions: true,
  skills: false,
  commands: false,
  subagents: false,
  scopedRules: false,
  hooks: false,
  mcp: false,
  projectConfig: false,
};

export function file(path) {
  return { type: "file", path };
}

export function directory(path) {
  return { type: "directory", path };
}

export function createAdapter(profile) {
  return {
    priority: 10,
    support: "experimental",
    verification: { contract: "verified", runtime: "unverified" },
    verifiedVersions: [],
    lastVerifiedAt: null,
    outputs: [{ path: "AGENTS.md", format: "document" }],
    signals: [],
    ...profile,
    capabilities: { ...fullCapabilities, ...profile.capabilities },
  };
}

export const portableProfile = {
  support: "portable",
  capabilities: { agentsMd: true },
};
