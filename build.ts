// Bundles the extension into dist/ (the load-unpacked target).
// One bundler, no webpack/vite - Bun's own. React is defined to production mode
// so the bundle carries no `process` reference (undefined in a content script).
//
// Usage:
//   bun run build.ts              # Chrome/Edge build (default)
//   bun run build.ts --firefox    # Firefox build (applies manifest overrides)
import { rm, mkdir, cp, readFile, writeFile } from "node:fs/promises";

const isFirefox = process.argv.includes("--firefox");

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

const result = await Bun.build({
  entrypoints: ["src/content.ts", "src/background.ts", "src/options.tsx", "src/popup.tsx"],
  outdir: "dist",
  target: "browser",
  minify: true,
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

const base = JSON.parse(await readFile("manifest.json", "utf-8"));

if (isFirefox) {
  const overrides = JSON.parse(await readFile("manifest.firefox.json", "utf-8"));
  const manifest = { ...base, ...overrides };
  await writeFile("dist/manifest.json", JSON.stringify(manifest, null, 2));
} else {
  await cp("manifest.json", "dist/manifest.json");
}

// Static assets copied verbatim next to the bundles.
await cp("src/styles.css", "dist/styles.css");
await cp("src/options.html", "dist/options.html");
await cp("src/popup.html", "dist/popup.html");
await cp("src/icons", "dist/icons", { recursive: true });

console.log("Built:", result.outputs.map((o) => o.path.replace(process.cwd() + "/", "")).join(", "));
