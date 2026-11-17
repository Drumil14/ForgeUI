import { describe, it, expect } from "vitest";
import { mkdtemp, writeFile, mkdir, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { parseFigmaFile, exportLibraryFiles } from "@forgeui/generate";
import type { FigmaFileResponse } from "@forgeui/core";

const exec = promisify(execFile);

/**
 * The strongest possible claim for the export: write the ZIP's file set to a
 * clean directory and TYPE-CHECK it with the real TypeScript compiler under
 * strict mode, exactly as a consumer's React app would.
 */

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const fixturePath = join(repoRoot, "fixtures", "figma", "sample-marketing.json");

describe("exported library compiles under strict tsc", () => {
  it("tsc --noEmit passes on the full export of the sample fixture", async () => {
    const file = JSON.parse(
      await readFile(fixturePath, "utf8"),
    ) as FigmaFileResponse;
    const design = parseFigmaFile(file, "sample-marketing");
    const files = exportLibraryFiles(design);

    const dir = await mkdtemp(join(tmpdir(), "forgeui-export-"));
    try {
      for (const f of files) {
        const target = join(dir, ...f.path.split("/"));
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, f.content);
      }
      await writeFile(
        join(dir, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            strict: true,
            noEmit: true,
            jsx: "react-jsx",
            module: "esnext",
            moduleResolution: "bundler",
            target: "es2022",
            lib: ["dom", "esnext"],
            skipLibCheck: true,
            // Resolve react types from the monorepo root.
            typeRoots: [join(repoRoot, "node_modules", "@types")],
            paths: {
              react: [join(repoRoot, "node_modules", "@types", "react")],
            },
          },
          include: ["components/**/*.ts", "components/**/*.tsx"],
        }),
      );

      const tsc = join(repoRoot, "node_modules", "typescript", "bin", "tsc");
      try {
        await exec(process.execPath, [tsc, "-p", dir], { cwd: dir });
      } catch (err) {
        const e = err as { stdout?: string; stderr?: string };
        expect.fail(
          `generated library failed tsc:\n${e.stdout ?? ""}${e.stderr ?? ""}`,
        );
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
