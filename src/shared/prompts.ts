// Quick-prompt palette defaults: infer-action directives. Editable in the options page.
export type Prompt = { id: string; label: string; description: string; insert: string };

export const DEFAULT_PROMPTS: Prompt[] = [
  { id: "infer", label: "@infer", description: "Trigger the Infer agent", insert: "@infer " },
  { id: "infer-review", label: "Review PR", description: "Ask the Infer agent to review this PR", insert: "@infer review this pull request for correctness and simplification." },
  { id: "infer-fix", label: "Fix issue", description: "Ask the Infer agent to fix this issue", insert: "@infer fix this issue." },
];
