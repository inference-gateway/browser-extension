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
