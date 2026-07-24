// The only chrome.* surface besides runtime messaging, isolated here so a future
// browser port swaps one file (or drops in webextension-polyfill).
export function get<T>(key: string): Promise<T | undefined> {
  return chrome.storage.local.get(key).then((o) => o[key] as T | undefined);
}

export function set(key: string, value: unknown): Promise<void> {
  return chrome.storage.local.set({ [key]: value });
}

export function remove(key: string): Promise<void> {
  return chrome.storage.local.remove(key);
}

// A blank/whitespace token clears the key instead of persisting "" — the token
// never lingers in storage as an empty string.
export function savePat(value: string): Promise<void> {
  const t = value.trim();
  return t ? set("pat", t) : remove("pat");
}
