// Service worker: the one place the cross-origin GitHub fetch is allowed to live
// (Chrome MV3 subjects content-script fetch to the page CSP; the worker is exempt),
// and the shared per-repo cache. Content script talks to it via runtime messaging.
import * as storage from "./shared/storage";
import type { Skill } from "./shared/messages";

const TTL = 10 * 60 * 1000; // 10 min

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "skills") return false;
  getSkills(msg.owner, msg.repo)
    .then((items) => sendResponse({ items }))
    .catch((err) => sendResponse({ error: String(err) }));
  return true; // async response
});

async function getSkills(owner: string, repo: string): Promise<Skill[]> {
  const key = `skills:${owner}/${repo}`;
  const cached = await storage.get<{ ts: number; items: Skill[] }>(key);
  if (cached && Date.now() - cached.ts < TTL) return cached.items;
  const items = await fetchFromGitHub(owner, repo);
  await storage.set(key, { ts: Date.now(), items });
  return items;
}

async function fetchFromGitHub(owner: string, repo: string): Promise<Skill[]> {
  const pat = await storage.get<string>("pat");
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (pat) headers.Authorization = `Bearer ${pat}`;
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/.agents/skills`,
    { headers },
  );
  if (res.status === 404) return []; // repo has no skills - degrade gracefully
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.filter((e) => e?.type === "dir").map((e) => ({ name: String(e.name) }));
}
