import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const packageRoot = new URL("../packages/agents/", import.meta.url);
const packageJson = JSON.parse(
  await readFile(new URL("package.json", packageRoot), "utf8"),
);
const stage = await mkdtemp(join(tmpdir(), "agent-compat-github-package-"));

try {
  await mkdir(join(stage, "src", "testing"), { recursive: true });
  await Promise.all([
    cp(new URL("src/", packageRoot), join(stage, "src"), { recursive: true }),
    cp(new URL("README.md", packageRoot), join(stage, "README.md")),
    cp(new URL("LICENSE", packageRoot), join(stage, "LICENSE")),
  ]);

  await writeFile(
    join(stage, "package.json"),
    `${JSON.stringify(
      {
        ...packageJson,
        name: "@JustineDevs/agents",
        publishConfig: {
          access: "public",
          registry: "https://npm.pkg.github.com",
        },
      },
      null,
      2,
    )}\n`,
  );

  await new Promise((resolve, reject) => {
    const child = spawn(
      "npm",
      [
        "publish",
        "--access",
        "public",
        "--registry",
        "https://npm.pkg.github.com",
      ],
      {
        cwd: stage,
        stdio: "inherit",
        env: process.env,
      },
    );
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`npm publish exited with ${code}`)),
    );
  });
} finally {
  await rm(stage, { recursive: true, force: true });
}
