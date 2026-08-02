// Caret pixel position in a textarea, converted to viewport coords for a
// position:fixed overlay. Reuses the textarea-caret mirror-div helper.
import getCaretCoordinates from "textarea-caret";

export type CaretPos = { left: number; top: number; height: number };

export function caretPosition(el: HTMLTextAreaElement, index: number): CaretPos {
  const c = getCaretCoordinates(el, index);
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left + c.left,
    top: rect.top + c.top,
    height: c.height,
  };
}
