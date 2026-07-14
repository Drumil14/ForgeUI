#!/usr/bin/env node
// Thin launcher: run the compiled CLI. `npm run build` produces dist/.
import { main } from "../dist/index.js";

main(process.argv.slice(2)).then(
  (code) => process.exit(code ?? 0),
  (err) => {
    console.error(err?.stack || String(err));
    process.exit(1);
  },
);
