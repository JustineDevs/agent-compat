import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import type { Adapter, Manifest, Skill } from "./types.js";

const MANAGED_BEGIN = "<!-- agents:begin -->";
const MANAGED_END = "<!-- agents:end -->";

export function normalizeRoot(root = ".") {
  return path.resolve(root);
}

export function resolveWithinRoot(root, relativePath) {
  const absoluteRoot = path.resolve(root);
  const absolutePath = path.resolve(absoluteRoot, relativePath);
  if (
    absolutePath !== absoluteRoot &&
    !absolutePath.startsWith(`${absoluteRoot}${path.sep}`)
  ) {
    throw new Error(`Path escapes output root: ${relativePath}`);
  }
  return absolutePath;
}

export async function assertSafeWritePath(root, relativePath) {
  const absoluteRoot = path.resolve(root);
  const absolutePath = resolveWithinRoot(absoluteRoot, relativePath);
  let current = absoluteRoot;
  try {
    if ((await fs.lstat(current)).isSymbolicLink()) {
      throw new Error(`Refusing symlink path: ${root}`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") throw error;
  }
  const relative = path.relative(absoluteRoot, absolutePath);
  for (const segment of relative ? relative.split(path.sep) : []) {
    current = path.join(current, segment);
    try {
      if ((await fs.lstat(current)).isSymbolicLink()) {
        throw new Error(`Refusing symlink path: ${relativePath}`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === "ENOENT") break;
      throw error;
    }
  }
  return absolutePath;
}

export async function readTextIfExists(targetPath) {
  try {
    return await fs.readFile(targetPath, "utf8");
  } catch {
    return null;
  }
}

async function ensureDirForFile(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export function isManagedDocument(content) {
  return (
    typeof content === "string" &&
    content.includes(MANAGED_BEGIN) &&
    content.includes(MANAGED_END)
  );
}

function upsertManagedBlock(existingContent, nextContent) {
  if (!existingContent) return nextContent;
  const beginIndex = existingContent.indexOf(MANAGED_BEGIN);
  const endIndex = existingContent.indexOf(MANAGED_END);
  if (beginIndex === -1 || endIndex === -1 || endIndex < beginIndex) {
    return null;
  }
  return `${existingContent.slice(0, beginIndex)}${nextContent}${existingContent.slice(endIndex + MANAGED_END.length)}`;
}

const writeLocks = new Map();

async function writeAtomic(targetPath, content) {
  const temporaryPath = `${targetPath}.agents-tmp-${process.pid}-${Date.now()}`;
  const flags =
    fsConstants.O_WRONLY |
    fsConstants.O_CREAT |
    fsConstants.O_EXCL |
    (fsConstants.O_NOFOLLOW ?? 0);
  let handle;
  try {
    handle = await fs.open(temporaryPath, flags, 0o644);
    await handle.writeFile(content);
    await handle.close();
    handle = undefined;
    await fs.rename(temporaryPath, targetPath);
  } finally {
    await handle?.close().catch(() => {});
    await fs.rm(temporaryPath, { force: true });
  }
}

export async function writeManagedFile(root, relativePath, content) {
  const absolutePath = await assertSafeWritePath(root, relativePath);
  const previous = writeLocks.get(absolutePath) ?? Promise.resolve();
  const current = previous.then(async () => {
    await ensureDirForFile(absolutePath);
    await assertSafeWritePath(root, relativePath);
    const existingContent = await readTextIfExists(absolutePath);
    if (existingContent == null) {
      await assertSafeWritePath(root, relativePath);
      await writeAtomic(absolutePath, content);
      return { path: relativePath, status: "created" };
    }
    const merged = upsertManagedBlock(existingContent, content);
    if (merged == null) return { path: relativePath, status: "skipped" };
    if (merged !== existingContent) {
      await assertSafeWritePath(root, relativePath);
      await writeAtomic(absolutePath, merged);
      return { path: relativePath, status: "updated" };
    }
    return { path: relativePath, status: "unchanged" };
  });
  const lock = current.catch(() => {});
  writeLocks.set(absolutePath, lock);
  try {
    return await current;
  } finally {
    if (writeLocks.get(absolutePath) === lock) writeLocks.delete(absolutePath);
  }
}

export function renderManifestDocument(
  manifest,
  target,
  output = { format: "document" },
) {
  const lines = [
    MANAGED_BEGIN,
    "<!-- Generated from agents.yaml. Edit the source, then run agents sync. -->",
    "",
    `# ${manifest.project?.name?.trim() || "Agent Compatibility Rules"}`,
  ];

  if (target?.description) {
    lines.push("", `Target: ${target.description}`);
  }

  if (
    Array.isArray(manifest.project?.stack) &&
    manifest.project.stack.length > 0
  ) {
    lines.push("", "## Stack");
    for (const item of manifest.project.stack) {
      lines.push(`- ${item}`);
    }
  }

  if (
    Array.isArray(manifest.instructions) &&
    manifest.instructions.length > 0
  ) {
    lines.push("", "## Instructions");
    for (const instruction of manifest.instructions) {
      lines.push(`- ${instruction}`);
    }
  }

  if (manifest.skills && typeof manifest.skills === "object") {
    const skillEntries = Object.entries(manifest.skills) as Array<
      [string, Skill]
    >;
    if (skillEntries.length > 0) {
      lines.push("", "## Skills");
      for (const [name, skill] of skillEntries) {
        lines.push(`### ${name}`);
        if (skill?.description) {
          lines.push(skill.description);
        }
        if (
          Array.isArray(skill?.instructions) &&
          skill.instructions.length > 0
        ) {
          lines.push("");
          for (const instruction of skill.instructions) {
            lines.push(`- ${instruction}`);
          }
        }
        if (Array.isArray(skill?.triggers) && skill.triggers.length > 0) {
          lines.push(`Triggers: ${skill.triggers.join(", ")}`);
        }
        if (Array.isArray(skill?.tools) && skill.tools.length > 0) {
          lines.push(`Tools: ${skill.tools.join(", ")}`);
        }
      }
    }
  }

  if (manifest.workflows && typeof manifest.workflows === "object") {
    const workflowEntries = Object.entries(manifest.workflows) as Array<
      [string, Record<string, any>]
    >;
    if (workflowEntries.length > 0) {
      lines.push("", "## Workflows");
      for (const [name, workflow] of workflowEntries) {
        lines.push(`### ${name}`);
        if (workflow?.description) {
          lines.push(workflow.description);
        }
        if (Array.isArray(workflow?.steps) && workflow.steps.length > 0) {
          lines.push("");
          for (const [index, step] of workflow.steps.entries()) {
            lines.push(`${index + 1}. ${step}`);
          }
        }
        if (Array.isArray(workflow?.gates) && workflow.gates.length > 0) {
          lines.push(`Gates: ${workflow.gates.join(", ")}`);
        }
      }
    }
  }

  if (manifest.roles && typeof manifest.roles === "object") {
    const roleEntries = Object.entries(manifest.roles) as Array<
      [string, Record<string, any>]
    >;
    if (roleEntries.length > 0) {
      lines.push("", "## Roles");
      for (const [name, role] of roleEntries) {
        lines.push(`### ${name}`);
        if (role?.description) {
          lines.push(role.description);
        }
        if (Array.isArray(role?.permissions) && role.permissions.length > 0) {
          lines.push(`Permissions: ${role.permissions.join(", ")}`);
        }
      }
    }
  }

  if (manifest.targets && typeof manifest.targets === "object") {
    const { auto, enabled, disabled } = manifest.targets;
    lines.push("", "## Targets");
    if (typeof auto === "boolean") {
      lines.push(`Auto: ${auto ? "enabled" : "disabled"}`);
    }
    if (Array.isArray(enabled) && enabled.length > 0) {
      lines.push(`Enabled: ${enabled.join(", ")}`);
    }
    if (Array.isArray(disabled) && disabled.length > 0) {
      lines.push(`Disabled: ${disabled.join(", ")}`);
    }
  }

  lines.push("", MANAGED_END, "");
  const body = lines.join("\n");
  if (output.format === "cursor") {
    return [
      "---",
      "description: Agent compatibility rules",
      "alwaysApply: true",
      "---",
      "",
      body,
    ].join("\n");
  }
  if (output.format === "skill") {
    const skillName = target.id === "openclaw" ? "agents" : "agent-compat";
    return [
      "---",
      `name: ${JSON.stringify(skillName)}`,
      `description: ${JSON.stringify(`${target.description || "Agent compatibility"} instructions`)}`,
      "---",
      "",
      body,
    ].join("\n");
  }
  return body;
}

export function renderSkillDocument(skillName, skill, target) {
  const lines = [
    "---",
    `name: ${JSON.stringify(skillName)}`,
    `description: ${JSON.stringify(skill?.description || `${target.description} skill`)}`,
    "---",
    "",
    MANAGED_BEGIN,
    "<!-- Generated from agents.yaml. Edit the source, then run agents sync. -->",
    "",
    `# ${skillName}`,
    "",
    skill?.description || "Generated agent skill",
  ];
  if (Array.isArray(skill?.triggers) && skill.triggers.length > 0) {
    lines.push("", `Triggers: ${skill.triggers.join(", ")}`);
  }
  if (Array.isArray(skill?.instructions) && skill.instructions.length > 0) {
    lines.push(
      "",
      "## Instructions",
      "",
      ...skill.instructions.map((instruction) => `- ${instruction}`),
    );
  }
  if (Array.isArray(skill?.tools) && skill.tools.length > 0) {
    lines.push("", `Tools: ${skill.tools.join(", ")}`);
  }
  lines.push("", MANAGED_END);
  return `${lines.join("\n")}\n`;
}

export function normalizeManifest(manifest) {
  const isRecord = (value: unknown): value is Record<string, any> =>
    value !== null && typeof value === "object" && !Array.isArray(value);
  const strings = (value, label) => {
    if (value === undefined) return [];
    if (
      !Array.isArray(value) ||
      value.some((item) => typeof item !== "string")
    ) {
      throw new TypeError(`${label} must be an array of strings`);
    }
    return [...value];
  };
  const optionalString = (value, label) => {
    if (value !== undefined && typeof value !== "string") {
      throw new TypeError(`${label} must be a string`);
    }
    return value ?? "";
  };
  if (!isRecord(manifest)) throw new TypeError("manifest must be an object");
  if (manifest.version !== 1) throw new TypeError("manifest.version must be 1");
  const project = manifest.project === undefined ? {} : manifest.project;
  if (!isRecord(project))
    throw new TypeError("manifest.project must be an object");
  const instructions = strings(manifest.instructions, "manifest.instructions");
  const skillsInput = manifest.skills === undefined ? {} : manifest.skills;
  if (!isRecord(skillsInput))
    throw new TypeError("manifest.skills must be an object");
  const skills = Object.fromEntries(
    Object.entries(skillsInput).map(([name, skill]) => {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
        throw new TypeError(`invalid skill name: ${name}`);
      }
      if (!isRecord(skill))
        throw new TypeError(`skill ${name} must be an object`);
      return [
        name,
        {
          ...skill,
          description: optionalString(
            skill.description,
            `skill ${name}.description`,
          ),
          instructions: strings(
            skill.instructions,
            `skill ${name}.instructions`,
          ),
          triggers: strings(skill.triggers, `skill ${name}.triggers`),
          tools: strings(skill.tools, `skill ${name}.tools`),
        },
      ];
    }),
  );
  const workflowsInput =
    manifest.workflows === undefined ? {} : manifest.workflows;
  if (!isRecord(workflowsInput))
    throw new TypeError("manifest.workflows must be an object");
  const workflows = Object.fromEntries(
    Object.entries(workflowsInput).map(([name, workflow]) => {
      if (!isRecord(workflow))
        throw new TypeError(`workflow ${name} must be an object`);
      return [
        name,
        {
          ...workflow,
          description: optionalString(
            workflow.description,
            `workflow ${name}.description`,
          ),
          steps: strings(workflow.steps, `workflow ${name}.steps`),
          gates: strings(workflow.gates, `workflow ${name}.gates`),
        },
      ];
    }),
  );
  const rolesInput = manifest.roles === undefined ? {} : manifest.roles;
  if (!isRecord(rolesInput))
    throw new TypeError("manifest.roles must be an object");
  const roles = Object.fromEntries(
    Object.entries(rolesInput).map(([name, role]) => {
      if (!isRecord(role))
        throw new TypeError(`role ${name} must be an object`);
      return [
        name,
        {
          ...role,
          description: optionalString(
            role.description,
            `role ${name}.description`,
          ),
          permissions: strings(role.permissions, `role ${name}.permissions`),
        },
      ];
    }),
  );
  const targets = manifest.targets === undefined ? {} : manifest.targets;
  if (!isRecord(targets))
    throw new TypeError("manifest.targets must be an object");
  if (targets.auto !== undefined && typeof targets.auto !== "boolean") {
    throw new TypeError("manifest.targets.auto must be a boolean");
  }
  const normalizedTargets = {
    ...targets,
    enabled: strings(targets.enabled, "manifest.targets.enabled"),
    disabled: strings(targets.disabled, "manifest.targets.disabled"),
  };
  return {
    version: 1,
    project: {
      name: optionalString(project.name, "manifest.project.name"),
      description: optionalString(
        project.description,
        "manifest.project.description",
      ),
      stack: strings(project.stack, "manifest.project.stack"),
    },
    instructions,
    skills,
    workflows,
    roles,
    targets: normalizedTargets,
  };
}
