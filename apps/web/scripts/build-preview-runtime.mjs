/**
 * Bundle the sandboxed preview runtime (React + ReactDOM + Tailwind browser
 * compiler + bootstrapper) into a single committed IIFE at
 * public/preview/runtime.js.
 *
 * Run from apps/web:  node scripts/build-preview-runtime.mjs
 * Wired into `prebuild`, so `next build` always ships a fresh runtime.
 */
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const appDir = dirname(dirname(fileURLToPath(import.meta.url)));

const result = await build({
  entryPoints: [join(appDir, "preview-runtime", "entry.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  outfile: join(appDir, "public", "preview", "runtime.js"),
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "info",
  metafile: true,
});

const out = Object.entries(result.metafile.outputs)[0];
console.log(`preview runtime: ${out[0]} (${(out[1].bytes / 1024).toFixed(0)} kB)`);
