# GitHub Comment Helper

A Manifest V3 browser extension that makes the org's **repo skills** and common
**bot directives** discoverable right inside GitHub's issue/PR comment box.

- **Skill tab-completion** - type `!` in a comment to open a caret-anchored,
  keyboard-navigable dropdown of the *current repo's* skills (from
  `.agents/skills/`), fuzzy-filtered as you type. Tab/Enter inserts `/<skill>`.
- **Quick prompts** - a palette (Ctrl/Cmd+Shift+P, or the `⚡` toolbar button) of
  the org's inline directives - `@claude`, `@infer`, `@codex`, `[browser]`,
  `[effort:...]`, `[model:...]`, `/subscription ...` - plus editable templates.

It never touches GitHub's own `@` / `#` / `:` completion, and every insertion fires
an `input` event so GitHub's draft-autosave and preview stay in sync.

## Install (Chrome/Edge, load unpacked)

```sh
bun install
bun run build      # outputs dist/
```

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. **Load unpacked** and select the `dist/` folder.
4. Open any GitHub issue/PR, focus the comment box, and type `!`.

## Skills source

On the first `!`, the extension resolves `owner/repo` from the page URL and calls
the GitHub **Contents API** (`GET /repos/{owner}/{repo}/contents/.agents/skills`),
caching the result per repo for 10 minutes. Repos with no skills directory simply
show nothing - native completion is untouched. Public repos work anonymously; for
**private** repos, add a fine-grained PAT (`Contents: read`) on the options page.

## Options

Right-click the extension → **Options** (or the Details page → *Extension options*):

- **Personal access token** - optional, only for private repos.
- **Quick prompts** - a JSON array of `{ id, label, description, insert }`, editable,
  with a *Reset to defaults* button.

## Multi-browser

This is built Chrome-first but deliberately portable - the same `dist/` is the whole
extension, and the only privileged API used is `chrome.storage` (present on
Chrome/Edge/Firefox). Per-browser notes:

| Browser      | What's needed                                                            |
| ------------ | ------------------------------------------------------------------------ |
| Chrome, Edge | Works as-is (`background.service_worker`).                               |
| Firefox 109+ | In `manifest.json`, swap `background.service_worker` → `background.scripts: ["background.js"]` and add a `browser_specific_settings.gecko.id`. |
| Safari       | Wrap `dist/` with `xcrun safari-web-extension-converter` (no code change).|

If the API surface ever grows beyond `chrome.storage`, drop in Mozilla's single-file
`webextension-polyfill` and alias `browser` → `chrome`.

## Develop

```sh
bun run typecheck   # tsc, extension source only
bun test            # fuzzy matcher + trigger boundary logic
bun run build       # rebuild dist/, then reload the unpacked extension
```

Layout: `src/content.ts` is the imperative controller (DOM detection, caret math,
insertion, keyboard); `src/ui/*` is the React view (skill menu + palette);
`src/background.ts` is the service worker that fetches + caches skills.

## Not in v1 (follow-ups)

- The newer React/ProseMirror composer on some 2024+ issue pages (v1 targets the
  classic `<textarea>`).
- Skill descriptions in the dropdown (would cost one API call per skill; names only
  for now, one call per repo).
- An org-wide skill catalog (v1 is per-repo).
- A packaged icon set, a build-time watch mode, and CI.
