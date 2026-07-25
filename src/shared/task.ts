import type { InitConfig } from "./models";

const TRIGGER = /@opentask\b/i;

export function taskBody(prompt: string): string {
  const text = prompt.trim();
  return TRIGGER.test(text) ? text : `@opentask\n\n${text}`;
}

export function taskTitle(prompt: string): string {
  const first = prompt.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  const cleaned = first.replace(TRIGGER, "").replace(/^[\s:\u2013\u2014-]+/, "").trim();
  const base = cleaned || "OpenTask task";
  return base.length > 80 ? `${base.slice(0, 79)}…` : base;
}

// Direct-prompt for a workflow_dispatch refine run: read one existing issue and rewrite its
// body in place. Names the issue explicitly since dispatch runs have no issue event context.
export function refinePrompt(owner: string, repo: string, issue: number): string {
  return [
    `Refine GitHub issue #${issue} in ${owner}/${repo}.`,
    `Read it with \`gh issue view ${issue}\`, then improve the title and description: a clear,`,
    `concise title, a well-structured summary, explicit acceptance criteria, and a sensible`,
    `layout. Do not change the issue's intent or scope. Apply the result in place with`,
    `\`gh issue edit ${issue} --title "<new title>" --body "<new body>"\`.`,
  ].join(" ");
}

// Direct-prompt for a workflow_dispatch init run: generate an AGENTS.md for the repo and
// open a PR, plus optional extras per the toggles. The agent runs in Linux CI, so it can
// create real symlinks with `ln -s`.
export function initPrompt(owner: string, repo: string, cfg: InitConfig): string {
  const parts = [
    `Initialize ${owner}/${repo} for agent workflows.`,
    `Explore the repository, then write an \`AGENTS.md\` at the root: a concise contributor`,
    `guide covering project structure, build/test/dev commands, coding style, and`,
    `commit/PR conventions - tailored to what this repo actually uses.`,
  ];
  if (cfg.githooks) {
    parts.push(
      `Also add an executable \`.githooks/pre-commit\` that runs this repo's typecheck/tests`,
      `before a commit, and document \`git config core.hooksPath .githooks\` in AGENTS.md so`,
      `contributors activate it (the committed hook is inert until they run that).`,
    );
  }
  if (cfg.claudeSymlink) {
    parts.push(`Also create a symlink \`CLAUDE.md\` -> \`AGENTS.md\` (a real symlink, e.g. \`ln -s AGENTS.md CLAUDE.md\`, not a copy).`);
  }
  if (cfg.skillsSymlink) {
    parts.push(`Also create a symlink \`.claude/skills\` -> \`.agents/skills\` (create the \`.claude/\` directory first, then \`ln -s ../.agents/skills .claude/skills\`).`);
  }
  parts.push(`Open a pull request with all of these changes.`);
  return parts.join(" ");
}
