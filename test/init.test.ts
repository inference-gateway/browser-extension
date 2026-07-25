import { expect, test } from "bun:test";
import { initPrompt } from "../src/shared/task";
import { DEFAULT_INIT, isInitConfig } from "../src/shared/models";

test("isInitConfig accepts the three-boolean shape and rejects others", () => {
  expect(isInitConfig(DEFAULT_INIT)).toBe(true);
  expect(isInitConfig({ githooks: true, claudeSymlink: false, skillsSymlink: true })).toBe(true);
  expect(isInitConfig({ githooks: true })).toBe(false);
  expect(isInitConfig({ githooks: "yes", claudeSymlink: false, skillsSymlink: false })).toBe(false);
  expect(isInitConfig(null)).toBe(false);
});

test("initPrompt always asks for AGENTS.md and a PR, and names the repo", () => {
  const p = initPrompt("acme", "widget", DEFAULT_INIT);
  expect(p).toContain("acme/widget");
  expect(p).toContain("AGENTS.md");
  expect(p).toContain("pull request");
  // Extras off by default.
  expect(p).not.toContain(".githooks/pre-commit");
  expect(p).not.toContain("CLAUDE.md");
  expect(p).not.toContain(".claude/skills");
});

test("initPrompt includes only the enabled extras", () => {
  expect(initPrompt("o", "r", { githooks: true, claudeSymlink: false, skillsSymlink: false })).toContain(".githooks/pre-commit");
  expect(initPrompt("o", "r", { githooks: false, claudeSymlink: true, skillsSymlink: false })).toContain("CLAUDE.md");
  expect(initPrompt("o", "r", { githooks: false, claudeSymlink: false, skillsSymlink: true })).toContain(".claude/skills");

  const all = initPrompt("o", "r", { githooks: true, claudeSymlink: true, skillsSymlink: true });
  expect(all).toContain(".githooks/pre-commit");
  expect(all).toContain("CLAUDE.md");
  expect(all).toContain(".claude/skills");
});
