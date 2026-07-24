// React-safe textarea write: GitHub's composer is a React-controlled input on some
// surfaces, so we set the value via the native prototype setter (bypassing React's
// value tracker) then dispatch `input` - which both React and GitHub's draft-autosave
// / preview listen to. Plain `el.value = ...` would be silently reverted by React.
function setNativeValue(el: HTMLTextAreaElement, value: string): void {
  const desc = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");
  desc?.set?.call(el, value);
}

export function replaceRange(el: HTMLTextAreaElement, from: number, to: number, text: string): void {
  const value = el.value;
  setNativeValue(el, value.slice(0, from) + text + value.slice(to));
  const caret = from + text.length;
  el.setSelectionRange(caret, caret);
  el.dispatchEvent(new InputEvent("input", { bubbles: true }));
  el.focus();
}
