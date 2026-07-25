const TRIGGER = /@infer\b/i;

export function taskBody(prompt: string): string {
  const text = prompt.trim();
  return TRIGGER.test(text) ? text : `@infer\n\n${text}`;
}

export function taskTitle(prompt: string): string {
  const first = prompt.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  const cleaned = first.replace(TRIGGER, "").replace(/^[\s:\u2013\u2014-]+/, "").trim();
  const base = cleaned || "Infer task";
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
