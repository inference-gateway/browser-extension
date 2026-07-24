<h1 align="center">GitHub Comment Helper</h1>

<p align="center">
  <!-- License Badge -->
  <a href="https://github.com/inference-gateway/browser-extension/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/inference-gateway/browser-extension?color=blue&style=flat-square" alt="License"/>
  </a>
  <!-- Manifest Badge -->
  <img src="https://img.shields.io/badge/Manifest-V3-blue?style=flat-square" alt="Manifest V3"/>
  <!-- Built With Badge -->
  <img src="https://img.shields.io/badge/built%20with-Bun%20%2B%20React-blue?style=flat-square" alt="Built with Bun + React"/>
</p>

A Manifest V3 browser extension that makes the org's **repo skills** and common
**bot directives** discoverable right inside GitHub's issue/PR comment box. It is
built Chrome-first but deliberately portable to Edge, Firefox, and Safari.

- [Key Features](#key-features)
- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Multi-Browser Support](#multi-browser-support)
- [Development](#development)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Key Features

- 📜 **Open Source**: Available under the Apache 2.0 License.
- ⚡ **Skill Tab-Completion**: Type `!` in a comment to open a caret-anchored,
  keyboard-navigable dropdown of the current repo's skills, fuzzy-filtered as you type.
- 🎛️ **Quick Prompts Palette**: A searchable palette of the org's inline bot
  directives (`@claude`, `@infer`, `@codex`, `[browser]`, `[effort:...]`,
  `[model:...]`, `/subscription ...`) plus editable templates.
- 🔍 **Repo-Aware**: Resolves `owner/repo` from the page and fetches
  `.agents/skills/` via the GitHub Contents API, cached per repo.
- 🤝 **Non-Intrusive**: Never touches GitHub's native `@` / `#` / `:` completion;
  insertions fire an `input` event so draft-autosave and preview stay in sync.
- 🌐 **Multi-Browser Ready**: One `dist/` bundle; only `chrome.storage` is used, so
  a port is a manifest tweak, not a rewrite.
- 🔒 **Private-Repo Support**: Optional fine-grained PAT (`Contents: read`), stored
  in extension storage.

## Overview

On the first `!`, the extension resolves `owner/repo` from the page URL and calls the
GitHub **Contents API** (`GET /repos/{owner}/{repo}/contents/.agents/skills`) from the
background service worker, caching the result per repo for 10 minutes. Repos with no
skills directory simply show nothing - native completion is untouched.

The quick-prompts palette is a self-contained popup opened by a keyboard shortcut or a
`⚡` button injected into the comment toolbar. Both surfaces share the same insertion
path, which writes through the native textarea setter so React-controlled composers and
GitHub's own draft/preview state stay consistent.

## Installation

Chrome / Edge, loaded unpacked:

```bash
bun install
bun run build      # outputs dist/
```

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. **Load unpacked** and select the `dist/` folder.
4. Open any GitHub issue/PR, focus the comment box, and type `!`.

## Usage

- **Skills**: type `!` at the start of a word to open the dropdown. Arrow keys
  navigate, `Tab` / `Enter` inserts `/<skill>`, `Esc` closes.
- **Quick prompts**: press `Ctrl/Cmd+Shift+P` (or click the `⚡` toolbar button) to
  open the palette, filter, and `Enter` to insert the selected template at the caret.

## Configuration

Right-click the extension → **Options** (or the Details page → *Extension options*):

- **Personal access token** - optional, only needed to list skills in **private**
  repos. Use a fine-grained token with `Contents: read`.
- **Quick prompts** - a JSON array of `{ id, label, description, insert }`, editable,
  with a *Reset to defaults* button.

## Multi-Browser Support

The same `dist/` is the whole extension, and the only privileged API used is
`chrome.storage` (present on Chrome/Edge/Firefox). Per-browser notes:

| Browser      | What's needed                                                            |
| ------------ | ------------------------------------------------------------------------ |
| Chrome, Edge | Works as-is (`background.service_worker`).                               |
| Firefox 109+ | In `manifest.json`, swap `background.service_worker` → `background.scripts: ["background.js"]` and add a `browser_specific_settings.gecko.id`. |
| Safari       | Wrap `dist/` with `xcrun safari-web-extension-converter` (no code change).|

If the API surface ever grows beyond `chrome.storage`, drop in Mozilla's single-file
`webextension-polyfill` and alias `browser` → `chrome`.

## Development

```bash
bun run typecheck   # tsc, extension source only
bun test            # fuzzy matcher + trigger boundary logic
bun run build       # rebuild dist/, then reload the unpacked extension
```

Layout: `src/content.ts` is the imperative controller (DOM detection, caret math,
insertion, keyboard); `src/ui/*` is the React view (skill menu + palette);
`src/background.ts` is the service worker that fetches and caches skills.

## Roadmap

- The newer React/ProseMirror composer on some 2024+ issue pages (v1 targets the
  classic `<textarea>`).
- Skill descriptions in the dropdown (would cost one API call per skill; names only
  for now, one call per repo).
- An org-wide skill catalog (v1 is per-repo).
- A packaged icon set, a build-time watch mode, and CI.

## Contributing

Found a bug or have a feature in mind? You're more than welcome to open issues or submit
pull requests for any fixes, improvements, or new ideas.

## License

This project is licensed under the Apache 2.0 License.
