import type { Skill } from "../shared/messages";
import type { Prompt } from "../shared/prompts";
import type { CaretPos } from "../lib/caret";

export type SkillResult = { item: Skill; positions: number[] };

// Inline skill menu: fully controlled by the content-script controller (the
// textarea keeps focus, so keyboard nav is driven from there, not React).
export type SkillView = {
  kind: "skill";
  results: SkillResult[];
  activeIndex: number;
  pos: CaretPos;
  onHover: (i: number) => void;
  onSelect: (i: number) => void;
};

// Quick-prompt palette: a self-managed popup that owns its own search + focus.
export type PaletteView = {
  kind: "palette";
  prompts: Prompt[];
  onPick: (p: Prompt) => void;
  onClose: () => void;
};

export type View = SkillView | PaletteView | null;
