// Send a runtime message, tolerating an invalidated extension context (a stale content
// script after the extension was reloaded) - chrome.runtime is undefined there.
export function ask(message: unknown, cb: (resp: { error?: string; [k: string]: unknown }) => void): void {
  if (!chrome.runtime?.id) return cb({ error: "Extension was reloaded - refresh this page." });
  chrome.runtime.sendMessage(message, cb);
}
