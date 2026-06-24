import { mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import esbuild from "esbuild";

await mkdir("web/dist", { recursive: true });

await esbuild.build({
  entryPoints: ["web/src/main.ts"],
  bundle: true,
  format: "esm",
  outfile: "web/dist/widget.js",
  sourcemap: false,
  target: "es2022",
});

await esbuild.build({
  entryPoints: ["web/src/styles.css"],
  bundle: true,
  outfile: "web/dist/widget.css",
  loader: { ".css": "css" },
  minify: false,
});

execFileSync("tsc", ["-p", "tsconfig.json"], { stdio: "inherit" });
