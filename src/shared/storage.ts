// The only chrome.* surface besides runtime messaging, isolated here so a future
// browser port swaps one file (or drops in webextension-polyfill). Every accessor
// tolerates an invalidated extension context (stale content script after a reload),
// where chrome.storage is undefined - it degrades to a no-op instead of throwing.
export function get<T>(key: string): Promise<T | undefined> {
  const area = chrome?.storage?.local;
  if (!area) return Promise.resolve(undefined);
  return area.get(key).then((o) => o[key] as T | undefined);
}

export function set(key: string, value: unknown): Promise<void> {
  const area = chrome?.storage?.local;
  if (!area) return Promise.resolve();
  return area.set({ [key]: value });
}

export function remove(key: string): Promise<void> {
  const area = chrome?.storage?.local;
  if (!area) return Promise.resolve();
  return area.remove(key);
}

// A blank/whitespace token clears the key instead of persisting "" - the token
// never lingers in storage as an empty string.
export function savePat(value: string): Promise<void> {
  const t = value.trim();
  return t ? set("pat", t) : remove("pat");
}
