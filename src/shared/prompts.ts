// Quick-prompt palette defaults: the org's real inline directives (exact syntax
// verified against claude.yml / infer.yml) plus a few composite templates.
// Editable in the options page.
export type Prompt = { id: string; label: string; description: string; insert: string };

export const DEFAULT_PROMPTS: Prompt[] = [
  { id: "claude", label: "@claude", description: "Trigger the Claude bot", insert: "@claude " },
  { id: "infer", label: "@infer", description: "Trigger the Infer bot", insert: "@infer " },
  { id: "codex", label: "@codex", description: "Trigger the Codex bot", insert: "@codex " },
  { id: "browser", label: "[browser]", description: "Enable browser MCP (Claude only)", insert: "[browser]" },
  { id: "effort-high", label: "[effort:high]", description: "Claude effort: low|medium|high|xhigh|max", insert: "[effort:high]" },
  { id: "effort-max", label: "[effort:max]", description: "Max Claude effort", insert: "[effort:max]" },
  { id: "model", label: "[model:...]", description: "Set Claude model id (fill in the id)", insert: "[model:]" },
  { id: "subscription", label: "/subscription", description: "Infer via Claude subscription", insert: "/subscription anthropic/claude-sonnet-4-6" },
  { id: "audit", label: "Ponytail audit", description: "Ask Claude to audit for over-engineering", insert: "@claude run a ponytail audit of this repo and report what to delete or simplify." },
  { id: "docs-drift", label: "Docs drift", description: "Ask Claude to check docs drift", insert: "@claude check this change for docs drift and open a [DOCS] follow-up if the public surface changed." },
  { id: "review", label: "Review", description: "Ask Claude to review this PR", insert: "@claude review this PR for correctness and simplification." },
];
