import fs from "node:fs/promises";
import path from "node:path";
import { detect } from "./detect.js";
import { getTargetAdapters } from "./registry.js";
import {
  assertSafeWritePath,
  isManagedDocument,
  readTextIfExists,
  resolveWithinRoot,
} from "./shared.js";

function parseFrontmatter(content) {
  if (!content?.startsWith("---\n")) return null;
  const end = content.indexOf("\n---\n", 4);
  if (end < 0) return null;
  const values = {};
  for (const line of content.slice(4, end).split("\n")) {
    const separator = line.indexOf(":");
    if (separator <= 0) return null;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!key || key in values) return null;
    try {
      values[key] = JSON.parse(value);
    } catch {
      values[key] = value;
    }
  }
  return values;
}

function checkOutput(content, output) {
  if (content == null)
    return { status: "invalid", score: 0, issue: `Missing ${output.path}` };
  if (!isManagedDocument(content))
    return {
      status: "partial",
      score: 60,
      issue: `${output.path} is not managed`,
    };
  if (output.maxBytes && Buffer.byteLength(content, "utf8") > output.maxBytes) {
    return {
      status: "invalid",
      score: 20,
      issue: `${output.path} exceeds ${output.maxBytes} byte limit`,
    };
  }
  if (output.format === "document" && !/^# .+/m.test(content)) {
    return {
      status: "invalid",
      score: 20,
      issue: `${output.path} is missing a document heading`,
    };
  }
  if (output.format === "cursor") {
    const frontmatter = parseFrontmatter(content);
    if (
      !frontmatter ||
      typeof frontmatter.description !== "string" ||
      typeof frontmatter.alwaysApply !== "boolean"
    ) {
      return {
        status: "invalid",
        score: 20,
        issue: `${output.path} has invalid Cursor frontmatter`,
      };
    }
  }
  if (output.format === "skill") {
    const frontmatter = parseFrontmatter(content);
    if (
      !frontmatter ||
      typeof frontmatter.name !== "string" ||
      typeof frontmatter.description !== "string"
    ) {
      return {
        status: "invalid",
        score: 20,
        issue: `${output.path} has invalid skill frontmatter`,
      };
    }
  }
  return { status: "valid", score: 100 };
}

export async function validate(root = ".", options = {}) {
  const absoluteRoot = path.resolve(root);
  const report = {};
  const results = {};
  const summary = { total: 0, valid: 0, partial: 0, invalid: 0, unknown: 0 };
  const requestedTargets =
    Array.isArray(options.targets) && options.targets.length > 0
      ? [...new Set(options.targets)]
      : (await detect(absoluteRoot)).map((entry) => entry.id);
  const adapters = getTargetAdapters(requestedTargets);

  for (const adapter of adapters) {
    const checks = [];
    for (const output of adapter.outputs) {
      try {
        checks.push(
          checkOutput(
            await readTextIfExists(
              await assertSafeWritePath(absoluteRoot, output.path),
            ),
            output,
          ),
        );
      } catch (error) {
        checks.push({
          status: "invalid",
          score: 0,
          issue: error instanceof Error ? error.message : String(error),
        });
      }
    }
    if (adapter.skillRoot) {
      try {
        const skillEntries = await fs.readdir(
          resolveWithinRoot(absoluteRoot, adapter.skillRoot),
          { withFileTypes: true },
        );
        for (const entry of skillEntries.filter((entry) =>
          entry.isDirectory(),
        )) {
          const skillPath = `${adapter.skillRoot}/${entry.name}/SKILL.md`;
          checks.push(
            checkOutput(
              await readTextIfExists(
                await assertSafeWritePath(absoluteRoot, skillPath),
              ),
              { path: skillPath, format: "skill" },
            ),
          );
        }
      } catch {
        // A missing skill directory is valid when the manifest declares no skills.
      }
    }
    const score = Math.round(
      checks.reduce((sum, check) => sum + check.score, 0) / checks.length,
    );
    const status = checks.some((check) => check.status === "invalid")
      ? "invalid"
      : checks.some((check) => check.status === "partial")
        ? "partial"
        : "valid";
    const issues = checks
      .filter((check) => check.issue)
      .map((check) => ({
        severity: status === "invalid" ? "error" : "warning",
        message: check.issue,
      }));
    const validation = {
      status,
      score,
      issues,
      capabilities: {
        instructions: adapter.capabilities.instructions ? "full" : "none",
        skills: adapter.capabilities.skills ? "full" : "none",
        mcp: adapter.capabilities.mcp ? "full" : "none",
        hooks: adapter.capabilities.hooks ? "full" : "none",
        commands: adapter.capabilities.commands ? "full" : "none",
        subagents: adapter.capabilities.subagents ? "full" : "none",
      },
    };
    const shortcut =
      status === "valid" ? "✓" : status === "partial" ? "◐" : "×";
    report[adapter.id] = shortcut;
    report[`${adapter.id}Validation`] = validation;
    results[adapter.id] = validation;
    summary.total += 1;
    summary[status] += 1;
  }

  return {
    valid: summary.invalid === 0 && summary.unknown === 0,
    targets: requestedTargets,
    results,
    summary,
    ...report,
  };
}
