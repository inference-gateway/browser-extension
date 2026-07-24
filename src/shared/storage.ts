// The only chrome.* surface besides runtime messaging, isolated here so a future
// browser port swaps one file (or drops in webextension-polyfill).
export function get<T>(key: string): Promise<T | undefined> {
  return chrome.storage.local.get(key).then((o) => o[key] as T | undefined);
}

export function set(key: string, value: unknown): Promise<void> {
  return chrome.storage.local.set({ [key]: value });
}
