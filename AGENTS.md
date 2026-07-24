# Repository Guidelines

## Project Structure & Module Organization

This is a Chrome-first Manifest V3 extension built with Bun, TypeScript, and React. `src/content.ts` controls GitHub page integration, keyboard handling, and insertion. `src/background.ts` owns GitHub API access and caching. React views live in `src/ui/`, reusable DOM and matching helpers in `src/lib/`, and messages, prompts, and storage contracts in `src/shared/`. Static extension files include `manifest.json`, `src/options.html`, and `src/styles.css`. Tests are in `test/`; the generated load-unpacked bundle is written to `dist/` and should not be edited directly.

## Build, Test, and Development Commands

- `bun install`: install dependencies from `bun.lock`.
- `bun run typecheck`: run strict TypeScript checks without emitting files.
- `bun test`: execute the Bun test suite.
- `bun run build`: clear and rebuild `dist/` with minified browser bundles and copied static assets.

For manual testing, rebuild, reload the unpacked `dist/` directory in `chrome://extensions`, then exercise an issue or pull-request comment box on GitHub. Before submitting changes, run all three CI checks: typecheck, tests, and build.

## Coding Style & Naming Conventions

Use TypeScript/TSX with ES modules, two-space indentation, double quotes, and semicolons, matching existing files. Keep strict types; avoid `any` when a message, view, or storage shape can be expressed explicitly. Use `camelCase` for functions and variables, `PascalCase` for React components and types, and descriptive lowercase filenames for utilities (for example, `src/lib/fuzzy.ts`). Keep browser-privileged API and cross-origin fetch logic in the background worker, not UI components. There is no separate formatter or linter, so preserve the established style and rely on `tsc` for static validation.

## Testing Guidelines

Tests use `bun:test` and follow the `test/*.test.ts` naming pattern. Add focused unit tests for matching, trigger boundaries, DOM helpers, and other pure behavior. Describe observable outcomes in test names. No coverage threshold is configured; cover regressions and edge cases introduced by each change. Run `bun test` locally.

## Commit & Pull Request Guidelines

History follows Conventional Commit-style subjects such as `feat: ...`, `docs: ...`, `chore: ...`, and scoped forms like `ci(infer): ...`. Keep commits focused and subjects imperative. Pull requests should explain the behavior change, link relevant issues, list verification commands, and include screenshots or a short recording for UI changes. Never commit personal access tokens or `.env`; document new configuration in `.env.example` and `README.md`.
