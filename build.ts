// Bundles the extension into dist/ (the load-unpacked target).
// One bundler, no webpack/vite - Bun's own. React is defined to production mode
// so the bundle carries no `process` reference (undefined in a content script).
import { rm, mkdir, cp } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

const result = await Bun.build({
  entrypoints: ["src/content.ts", "src/background.ts", "src/options.tsx"],
  outdir: "dist",
  target: "browser",
  minify: true,
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

// Static assets copied verbatim next to the bundles.
await cp("manifest.json", "dist/manifest.json");
await cp("src/styles.css", "dist/styles.css");
await cp("src/options.html", "dist/options.html");
await cp("src/icons", "dist/icons", { recursive: true });

console.log("Built:", result.outputs.map((o) => o.path.replace(process.cwd() + "/", "")).join(", "));
