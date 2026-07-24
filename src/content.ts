// Content-script controller. Owns all state for the inline skill menu and drives
// React purely as a view (root.render on each change). The textarea keeps focus, so
// keyboard nav for the skill menu is intercepted here, not in React.
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App } from "./ui/App";
import type { View, SkillResult } from "./ui/types";
import { isCommentBox, getTrigger, repoFromUrl } from "./lib/dom";
import { caretPosition } from "./lib/caret";
import { fuzzyFilter } from "./lib/fuzzy";
import { replaceRange } from "./lib/insert";
import * as storage from "./shared/storage";
import { DEFAULT_PROMPTS, type Prompt } from "./shared/prompts";
import type { Skill } from "./shared/messages";

let root: Root | null = null;
let view: View = null;
let lastBox: HTMLTextAreaElement | null = null;

// --- React root (resilient to GitHub's Turbo body swaps) ---
function ensureRoot(): Root {
  let host = document.getElementById("igw-root");
  if (!host) {
    host = document.createElement("div");
    host.id = "igw-root";
    document.body.appendChild(host);
    root = createRoot(host);
  } else if (!root) {
    root = createRoot(host);
  }
  return root!;
}

function render(): void {
  ensureRoot().render(createElement(App, { view }));
}

// --- Inline skill menu ---
type SkillState = {
  box: HTMLTextAreaElement;
  triggerIndex: number;
  all: Skill[];
  results: SkillResult[];
  active: number;
};
let skill: SkillState | null = null;

function fetchSkills(owner: string, repo: string): Promise<Skill[]> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "skills", owner, repo }, (resp) => {
      if (chrome.runtime.lastError || !resp || resp.error) return resolve([]);
      resolve(resp.items ?? []);
    });
  });
}

async function onInput(box: HTMLTextAreaElement): Promise<void> {
  const trig = getTrigger(box);
  if (!trig) return closeSkill();

  // (Re)open when the trigger appears or moves to a new position.
  if (!skill || skill.box !== box || skill.triggerIndex !== trig.index) {
    const repo = repoFromUrl();
    if (!repo) return closeSkill();
    const all = await fetchSkills(repo.owner, repo.repo);
    // Guard against a stale async result (user kept typing / moved the caret).
    const now = getTrigger(box);
    if (!now || now.index !== trig.index) return;
    if (all.length === 0) return closeSkill(); // repo has no skills - stay silent
    skill = { box, triggerIndex: trig.index, all, results: [], active: 0 };
  }

  const q = getTrigger(box);
  if (!q) return closeSkill();
  skill.results = fuzzyFilter(skill.all, q.query, (s) => s.name).map((r) => ({
    item: r.item,
    positions: r.positions,
  }));
  skill.active = 0;
  updateSkillView();
}

function updateSkillView(): void {
  if (!skill) return;
  view = {
    kind: "skill",
    results: skill.results,
    activeIndex: skill.active,
    pos: caretPosition(skill.box, skill.triggerIndex),
    onHover: (i) => {
      if (skill) {
        skill.active = i;
        updateSkillView();
      }
    },
    onSelect: (i) => {
      if (skill) {
        skill.active = i;
        commitSkill();
      }
    },
  };
  render();
}

function commitSkill(): void {
  if (!skill || skill.results.length === 0) return closeSkill();
  const chosen = skill.results[skill.active];
  if (chosen) {
    // Replace the typed '!query' with the skill invocation.
    replaceRange(skill.box, skill.triggerIndex, skill.box.selectionStart ?? skill.triggerIndex, `/${chosen.item.name} `);
  }
  closeSkill();
}

function closeSkill(): void {
  if (!skill) return;
  skill = null;
  view = null;
  render();
}

// --- Quick-prompt palette ---
async function openPalette(box: HTMLTextAreaElement): Promise<void> {
  closeSkill();
  lastBox = box;
  const custom = await storage.get<Prompt[]>("prompts");
  const prompts = custom && custom.length ? custom : DEFAULT_PROMPTS;
  view = {
    kind: "palette",
    prompts,
    onPick: (p) => {
      const el = lastBox;
      if (el) replaceRange(el, el.selectionStart ?? el.value.length, el.selectionEnd ?? el.value.length, p.insert);
      closePalette();
    },
    onClose: closePalette,
  };
  render();
}

function closePalette(): void {
  view = null;
  render();
  lastBox?.focus();
}

// --- Event wiring (delegation, so it survives SPA navigation) ---
document.addEventListener("input", (e) => {
  if (isCommentBox(e.target)) void onInput(e.target);
});

document.addEventListener("focusin", (e) => {
  if (isCommentBox(e.target)) {
    lastBox = e.target;
    tryInjectButton(e.target);
  }
});

// Close the inline menu when focus leaves the box (menu clicks preventDefault, so
// they don't blur it).
document.addEventListener("focusout", (e) => {
  if (skill && e.target === skill.box) closeSkill();
});

document.addEventListener(
  "keydown",
  (e) => {
    // Skill menu navigation (intercept before GitHub's own handlers).
    if (skill && view?.kind === "skill") {
      const len = skill.results.length;
      if (e.key === "ArrowDown" && len) {
        e.preventDefault();
        skill.active = (skill.active + 1) % len;
        updateSkillView();
      } else if (e.key === "ArrowUp" && len) {
        e.preventDefault();
        skill.active = (skill.active - 1 + len) % len;
        updateSkillView();
      } else if ((e.key === "Enter" || e.key === "Tab") && len) {
        e.preventDefault();
        commitSkill();
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeSkill();
      }
      return;
    }
    // Palette shortcut: Ctrl/Cmd+Shift+P while a comment box is focused.
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "P" || e.key === "p")) {
      if (isCommentBox(document.activeElement)) {
        e.preventDefault();
        void openPalette(document.activeElement as HTMLTextAreaElement);
      }
    }
  },
  true,
);

// ponytail: best-effort toolbar button - GitHub's markdown toolbar markup churns, so
// this is allowed to find nothing; the keyboard shortcut is the reliable path.
const buttoned = new WeakSet<Element>();
function tryInjectButton(box: HTMLTextAreaElement): void {
  try {
    const toolbar = box.id
      ? document.querySelector(`markdown-toolbar[for="${CSS.escape(box.id)}"]`)
      : null;
    if (!toolbar || buttoned.has(toolbar)) return;
    buttoned.add(toolbar);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "igw-palette-btn";
    btn.title = "Quick prompts (Ctrl/Cmd+Shift+P)";
    btn.textContent = "⚡"; // lightning
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      void openPalette(box);
    });
    toolbar.appendChild(btn);
  } catch {
    // ignore - the shortcut still works
  }
}
