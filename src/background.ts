import * as storage from "./shared/storage";
import type { Skill, SkillsCatalogResponse, ApplySkillsResponse, DispatchTaskResponse, AgentsCatalogResponse } from "./shared/messages";
import { DEFAULT_MODELS, DEFAULT_PERMISSIONS, DEFAULT_PLUGINS, DEFAULT_INIT, isModelOption, isPermissions, isPluginOption, isInitConfig, enabledPlugins, workflowYaml, prBody } from "./shared/models";
import type { ModelOption, BotConfig, Permissions, PluginOption } from "./shared/models";
import { REGISTRY, parseSource, isCatalogSkill, type CatalogSkill } from "./shared/skills";
import { taskBody, taskTitle, refinePrompt, initPrompt } from "./shared/task";
import { CATALOG_URL, agentsFromCatalog, type AgentManifest } from "./shared/agents";

const TTL = 10 * 60 * 1000;

const WORKFLOW_PATH = ".github/workflows/tasks.yml";
const WORKFLOW_FILE = "tasks.yml";
const BRANCH = "infer-agent-install";
const SKILLS_BRANCH = "infer-skills-update";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "check-install") {
    checkInstall(msg.owner, msg.repo)
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }
  if (msg?.type === "install") {
    doInstall(msg.owner, msg.repo, msg.model)
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }
  if (msg?.type === "create-task") {
    createTask(msg.owner, msg.repo, msg.prompt)
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }
  if (msg?.type === "dispatch-task") {
    dispatchTask(msg.owner, msg.repo, msg.model, msg.prompt)
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }
  if (msg?.type === "refine-issue") {
    refineIssue(msg.owner, msg.repo, msg.issue)
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }
  if (msg?.type === "init-project") {
    initProject(msg.owner, msg.repo)
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }
  if (msg?.type === "skills-catalog") {
    getCatalog(msg.owner, msg.repo)
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }
  if (msg?.type === "apply-skills") {
    applySkills(msg.owner, msg.repo, msg.add, msg.remove)
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }
  if (msg?.type === "list-owners") {
    listOwners(msg.token)
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }
  if (msg?.type === "agents-catalog") {
    fetchAgentsCatalog()
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }
  if (msg?.type !== "skills") return false;
  getSkills(msg.owner, msg.repo)
    .then((items) => sendResponse({ items }))
    .catch((err) => sendResponse({ error: String(err) }));
  return true;
});

async function getSkills(owner: string, repo: string): Promise<Skill[]> {
  const key = `skills:${owner}/${repo}`;
  const cached = await storage.get<{ ts: number; items: Skill[] }>(key);
  if (cached && Date.now() - cached.ts < TTL) return cached.items;

  const repoSkills = await fetchFromGitHub(owner, repo);

  const pluginSkills = await fetchPluginSkills();

  const names = new Set(repoSkills.map((s) => s.name));
  const items = [...repoSkills, ...pluginSkills.filter((s) => !names.has(s.name))];

  await storage.set(key, { ts: Date.now(), items });
  return items;
}

async function loadPlugins(): Promise<PluginOption[]> {
  const stored = await storage.get<unknown>("plugins");
  return Array.isArray(stored) && stored.every(isPluginOption)
    ? (stored as PluginOption[])
    : DEFAULT_PLUGINS;
}

// Agent names the user checked in the Agents panel (AgentsTab), fed to infer-action's
// `agents:` input on (re)install.
async function loadSelectedAgents(): Promise<string[]> {
  const stored = await storage.get<unknown>("selected-agents");
  return Array.isArray(stored) ? stored.filter((x): x is string => typeof x === "string") : [];
}

async function fetchPluginSkills(): Promise<Skill[]> {
  const plugins = await loadPlugins();
  return enabledPlugins(plugins).map((id) => {
    const name = id.split("/").pop()!;
    return { name: `${name}:${name}` };
  });
}

// Resolves the token for a repo owner (owner-specific, else the blank-owner default).
async function patFor(owner: string): Promise<string | undefined> {
  return storage.tokenFor(owner, await storage.loadTokens());
}

// Resolves the GitHub App config for a repo owner (owner-specific, else the default).
async function botFor(owner: string): Promise<BotConfig> {
  return storage.botFor(owner, await storage.loadBots());
}

// The owners a token can act as: the authenticated user plus their orgs. Powers the
// options-page account dropdown so owners are picked from GitHub, never hand-typed.
async function listOwners(token: string): Promise<{ owners: string[]; orgs: string[] } | { error: string }> {
  if (!token) return { owners: [], orgs: [] };
  const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}` };
  const [user, orgs] = await Promise.all([
    fetch("https://api.github.com/user", { headers }),
    fetch("https://api.github.com/user/orgs?per_page=100", { headers }),
  ]);
  if (!user.ok) return { error: `GitHub ${user.status}` };
  const login = (await user.json()).login as string;
  const orgList = orgs.ok ? ((await orgs.json()) as { login: string }[]).map((o) => o.login) : [];
  return { owners: [...new Set([login, ...orgList].filter(Boolean))], orgs: orgList };
}

async function fetchFromGitHub(owner: string, repo: string): Promise<Skill[]> {
  const pat = await patFor(owner);
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

async function ghFetch(owner: string, repo: string, path: string, init?: RequestInit): Promise<Response> {
  const pat = await patFor(owner);
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (pat) headers.Authorization = `Bearer ${pat}`;
  if (init?.headers) Object.assign(headers, init.headers);
  const url = path
    ? `https://api.github.com/repos/${owner}/${repo}/${path}`
    : `https://api.github.com/repos/${owner}/${repo}`;
  return fetch(url, { ...init, headers });
}

async function checkInstall(owner: string, repo: string): Promise<{ installed: boolean; url?: string } | { error: string }> {
  const pat = await patFor(owner);
  if (!pat) return { error: "No PAT configured. Add a fine-grained token with Contents: write, Pull requests: write, and Workflows: write in the extension options." };

  const res = await ghFetch(owner, repo, `contents/${WORKFLOW_PATH}`);
  if (res.status === 200) {
    const data = await res.json();
    return { installed: true, url: data.html_url };
  }
  if (res.status === 404) return { installed: false };
  if (res.status === 403) return { error: "PAT lacks the required scopes. The token needs Contents: write, Pull requests: write, and Workflows: write." };
  throw new Error(`GitHub ${res.status}`);
}

async function doInstall(owner: string, repo: string, model: string): Promise<{ prUrl: string; manual?: boolean } | { error: string }> {
  const storedModels = await storage.get<unknown[]>("models");
  const models: ModelOption[] = Array.isArray(storedModels) && storedModels.length && storedModels.every(isModelOption)
    ? (storedModels as ModelOption[])
    : DEFAULT_MODELS;
  const bot: BotConfig = await botFor(owner);
  const storedPerms = await storage.get<unknown>("permissions");
  const perms: Permissions = isPermissions(storedPerms) ? storedPerms : DEFAULT_PERMISSIONS;
  const plugins = await loadPlugins();
  const agents = await loadSelectedAgents();
  const defaultModel = models.some((m) => m.model === model) ? model : models[0].model;

  const pat = await patFor(owner);
  if (!pat) return { error: "No PAT configured. Add a fine-grained token with Contents: write, Pull requests: write, and Workflows: write in the extension options." };

  const repoRes = await ghFetch(owner, repo, "");
  if (!repoRes.ok) {
    if (repoRes.status === 403) return { error: "PAT lacks the required scopes. The token needs Contents: write, Pull requests: write, and Workflows: write." };
    throw new Error(`GitHub ${repoRes.status}`);
  }
  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch;
  const headSha = repoData.head?.sha ?? (await ghFetch(owner, repo, `git/refs/heads/${defaultBranch}`).then((r) => r.json())).object.sha;

  // Fresh, unique branch per install. Reusing one fixed branch accumulates closed PRs and
  // force-pushes, which can poison GitHub's PR-create for that head (500s via API *and* web
  // UI). A new branch name has no such history, so the PR opens cleanly.
  const branch = `${BRANCH}-${Date.now().toString(36)}`;
  const branchRes = await ghFetch(owner, repo, "git/refs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: headSha }),
  });
  if (!branchRes.ok) {
    if (branchRes.status === 403) return { error: "PAT lacks the required scopes. The token needs Contents: write, Pull requests: write, and Workflows: write." };
    throw new Error(`GitHub ${branchRes.status}`);
  }

  const content = btoa(workflowYaml(models, defaultModel, bot, perms, enabledPlugins(plugins), agents));
  const existing = await ghFetch(owner, repo, `contents/${WORKFLOW_PATH}?ref=${branch}`);
  const sha = existing.status === 200 ? (await existing.json()).sha : undefined;
  const putRes = await ghFetch(owner, repo, `contents/${WORKFLOW_PATH}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "feat: add OpenTask Agent workflow",
      content,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!putRes.ok) {
    if (putRes.status === 403) return { error: "PAT lacks the required scopes. The token needs Contents: write, Pull requests: write, and Workflows: write." };
    throw new Error(`GitHub ${putRes.status}`);
  }

  const title = "feat: add OpenTask Agent workflow";
  const body = prBody(models, defaultModel, bot, enabledPlugins(plugins), agents);
  const prRes = await openPull(owner, repo, { title, head: branch, base: defaultBranch, body });
  if (prRes.ok) return { prUrl: (await prRes.json()).html_url };
  if (prRes.status === 403) return { error: "PAT lacks the required scopes. The token needs Pull requests: write." };
  if (prRes.status === 422) return { error: "The workflow is already up to date - nothing to re-install." };
  if (prRes.status >= 500) {
    const detail = await prRes.text().catch(() => "");
    console.warn(`[igw] POST /pulls ${prRes.status}: ${detail.slice(0, 300)}`);
    const q = `expand=1&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    return { prUrl: `https://github.com/${owner}/${repo}/compare/${defaultBranch}...${branch}?${q}`, manual: true };
  }
  throw new Error(`GitHub ${prRes.status}`);
}

// Send a free-text task: open an issue whose body carries the "@opentask" trigger, so
// the installed workflow fires on issues.opened and the agent picks it up.
async function createTask(owner: string, repo: string, prompt: string): Promise<{ url: string } | { error: string }> {
  if (!prompt || !prompt.trim()) return { error: "Task is empty." };
  const pat = await patFor(owner);
  if (!pat) return { error: "No PAT configured. Add a fine-grained token with Issues: write in the extension options." };

  const res = await ghFetch(owner, repo, "issues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: taskTitle(prompt), body: taskBody(prompt) }),
  });
  if (res.status === 403) return { error: "PAT lacks Issues: write. Grant it in the extension options." };
  if (res.status === 404) return { error: "Repo not found, or the PAT can't access it." };
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const data = await res.json();
  return { url: data.html_url };
}

// Run a free-text task without an issue: dispatch the installed workflow with the prompt,
// which infer-action picks up via its direct-prompt input.
async function dispatchTask(owner: string, repo: string, model: string, prompt: string): Promise<DispatchTaskResponse> {
  if (!prompt || !prompt.trim()) return { error: "Task is empty." };
  const pat = await patFor(owner);
  if (!pat) return { error: "No PAT configured. Add a fine-grained token with Actions: write in the extension options." };

  const repoRes = await ghFetch(owner, repo, "");
  if (!repoRes.ok) return ghError(repoRes.status);
  const base = (await repoRes.json()).default_branch;

  const res = await ghFetch(owner, repo, `actions/workflows/${WORKFLOW_FILE}/dispatches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref: base, inputs: { model, prompt } }),
  });
  if (res.status === 204) return { url: `https://github.com/${owner}/${repo}/actions` };
  if (res.status === 404) return { error: "Workflow not found on the default branch. Merge the OpenTask Agent install PR first." };
  if (res.status === 403) return { error: "PAT lacks Actions: write. Grant it in the extension options." };
  if (res.status === 422) return { error: "Dispatch rejected - the installed workflow may predate the prompt input. Re-install the OpenTask Agent workflow." };
  throw new Error(`GitHub ${res.status}`);
}

// Refine one existing issue: pick the default model and dispatch the workflow with a
// refine prompt. Delegates to dispatchTask for the actual dispatch + error handling.
async function refineIssue(owner: string, repo: string, issue: number): Promise<DispatchTaskResponse> {
  const stored = await storage.get<unknown[]>("models");
  const models: ModelOption[] = Array.isArray(stored) && stored.length && stored.every(isModelOption)
    ? (stored as ModelOption[])
    : DEFAULT_MODELS;
  return dispatchTask(owner, repo, models[0].model, refinePrompt(owner, repo, issue));
}

// Scaffold a repo: read the global init config, then dispatch the installed workflow with
// an init prompt. Like refineIssue, delegates to dispatchTask for dispatch + error handling
// (including "workflow not found - merge the install PR first" when it isn't installed yet).
async function initProject(owner: string, repo: string): Promise<DispatchTaskResponse> {
  const storedModels = await storage.get<unknown[]>("models");
  const models: ModelOption[] = Array.isArray(storedModels) && storedModels.length && storedModels.every(isModelOption)
    ? (storedModels as ModelOption[])
    : DEFAULT_MODELS;
  const storedInit = await storage.get<unknown>("init");
  const init = isInitConfig(storedInit) ? storedInit : DEFAULT_INIT;
  return dispatchTask(owner, repo, models[0].model, initPrompt(owner, repo, init));
}

// --- Skills registry ---
async function getCatalog(owner: string, repo: string): Promise<SkillsCatalogResponse> {
  const [catalog, installed, languages] = await Promise.all([
    fetchCatalog(),
    getSkills(owner, repo).then((s) => s.map((x) => x.name)),
    fetchLanguages(owner, repo),
  ]);
  return { catalog, installed, languages };
}

async function fetchCatalog(): Promise<CatalogSkill[]> {
  const key = "skills-catalog";
  const cached = await storage.get<{ ts: number; items: CatalogSkill[] }>(key);
  if (cached && Date.now() - cached.ts < TTL) return cached.items;
  const res = await ghFetch(REGISTRY.owner, REGISTRY.repo, "contents/catalog.json");
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const file = await res.json();
  const json = JSON.parse(decodeBase64(file.content));
  const items: CatalogSkill[] = Array.isArray(json.skills) ? json.skills.filter(isCatalogSkill) : [];
  await storage.set(key, { ts: Date.now(), items });
  return items;
}

async function fetchLanguages(owner: string, repo: string): Promise<string[]> {
  const res = await ghFetch(owner, repo, "languages");
  if (!res.ok) return [];
  const data = await res.json();
  return Object.entries(data as Record<string, number>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([lang]) => lang);
}

// --- Agents catalog ---
async function fetchAgentsCatalog(): Promise<AgentsCatalogResponse> {
  const key = "agents-catalog";
  const cached = await storage.get<{ ts: number; items: AgentManifest[] }>(key);
  if (cached && Date.now() - cached.ts < TTL) return { catalog: cached.items };
  const res = await fetch(CATALOG_URL);
  if (!res.ok) return { error: `Failed to fetch agents catalog (HTTP ${res.status})` };
  const json = await res.json();
  const items = agentsFromCatalog(json);
  await storage.set(key, { ts: Date.now(), items });
  return { catalog: items };
}

async function applySkills(owner: string, repo: string, add: string[], remove: string[]): Promise<ApplySkillsResponse> {
  if (!add.length && !remove.length) return { error: "No changes selected." };
  const pat = await patFor(owner);
  if (!pat) return { error: "No PAT configured. Add a fine-grained token with Contents: write and Pull requests: write in the extension options." };

  const repoRes = await ghFetch(owner, repo, "");
  if (!repoRes.ok) return ghError(repoRes.status);
  const base = (await repoRes.json()).default_branch;
  const baseSha = (await ghFetch(owner, repo, `git/refs/heads/${base}`).then((r) => r.json())).object.sha;
  const baseTree = (await ghFetch(owner, repo, `git/commits/${baseSha}`).then((r) => r.json())).tree.sha;

  const tree: Record<string, unknown>[] = [];

  if (add.length) {
    const catalog = await fetchCatalog();
    for (const name of add) {
      const entry = catalog.find((c) => c.name === name);
      const src = entry && parseSource(entry.source);
      if (!src) return { error: `Skill "${name}" has no resolvable source.` };
      const srcTree = await resolveTree(src.owner, src.repo, src.ref);
      const files = (await listTreeFiles(src.owner, src.repo, srcTree)).filter((f) => f.path.startsWith(`${src.path}/`));
      if (!files.length) return { error: `Skill "${name}" is empty at its source.` };
      for (const f of files) {
        const rel = f.path.slice(src.path.length + 1);
        const blob = await ghFetch(src.owner, src.repo, `git/blobs/${f.sha}`).then((r) => r.json());
        const made = await ghFetch(owner, repo, "git/blobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: blob.content, encoding: "base64" }),
        }).then((r) => r.json());
        tree.push({ path: `.agents/skills/${name}/${rel}`, mode: f.mode, type: "blob", sha: made.sha });
      }
    }
  }

  if (remove.length) {
    const current = await listTreeFiles(owner, repo, baseTree);
    for (const name of remove) {
      const prefix = `.agents/skills/${name}/`;
      for (const f of current.filter((f) => f.path.startsWith(prefix))) {
        tree.push({ path: f.path, mode: f.mode, type: "blob", sha: null });
      }
    }
  }

  if (!tree.length) return { error: "Nothing to change." };

  const newTree = await ghFetch(owner, repo, "git/trees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base_tree: baseTree, tree }),
  }).then((r) => r.json());

  const parts = [add.length ? `install ${add.join(", ")}` : "", remove.length ? `remove ${remove.join(", ")}` : ""].filter(Boolean).join("; ");
  const commit = await ghFetch(owner, repo, "git/commits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: `chore: update OpenTask skills (${parts})`, tree: newTree.sha, parents: [baseSha] }),
  }).then((r) => r.json());

  // Fresh, unique branch per apply - a reused branch's PR history can poison GitHub's
  // PR-create (500s), so never reuse one. See doInstall for the same reasoning.
  const skillsBranch = `${SKILLS_BRANCH}-${Date.now().toString(36)}`;
  const mk = await ghFetch(owner, repo, "git/refs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref: `refs/heads/${skillsBranch}`, sha: commit.sha }),
  });
  if (!mk.ok) return ghError(mk.status);

  const title = "chore: update OpenTask skills";
  const body = skillsPrBody(add, remove);
  const prRes = await openPull(owner, repo, { title, head: skillsBranch, base, body });
  if (prRes.ok) return { prUrl: (await prRes.json()).html_url };
  if (prRes.status >= 500) {
    const detail = await prRes.text().catch(() => "");
    console.warn(`[igw] POST /pulls ${prRes.status}: ${detail.slice(0, 300)}`);
    const q = `expand=1&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    return { prUrl: `https://github.com/${owner}/${repo}/compare/${base}...${skillsBranch}?${q}` };
  }
  return ghError(prRes.status);
}

// GitHub's POST /pulls transiently 500s in the moment right after a branch ref is
// updated + committed (its diff isn't computed yet), so retry a few times on 5xx.
// ponytail: fixed 3-try / 1.5s backoff; enough for GitHub's post-push replication lag.
async function openPull(owner: string, repo: string, payload: Record<string, unknown>): Promise<Response> {
  let res!: Response;
  for (let i = 0; i < 3; i++) {
    res = await ghFetch(owner, repo, "pulls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok || res.status < 500) return res;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return res;
}

function skillsPrBody(add: string[], remove: string[]): string {
  const lines = [
    "## Update OpenTask skills",
    "",
    "Applied from the [Inference Gateway skills registry](https://github.com/inference-gateway/skills) via the browser extension. Skills live under `.agents/skills/`.",
  ];
  if (add.length) lines.push("", `**Installed:** ${add.map((n) => `\`${n}\``).join(", ")}`);
  if (remove.length) lines.push("", `**Removed:** ${remove.map((n) => `\`${n}\``).join(", ")}`);
  return lines.join("\n") + "\n";
}

// Resolve a ref (branch or tag) to its tree sha; the trees API wants a tree sha, not a ref.
async function resolveTree(owner: string, repo: string, ref: string): Promise<string> {
  const res = await ghFetch(owner, repo, `commits/${ref}`);
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return (await res.json()).commit.tree.sha;
}

async function listTreeFiles(owner: string, repo: string, treeSha: string): Promise<{ path: string; sha: string; mode: string }[]> {
  const res = await ghFetch(owner, repo, `git/trees/${treeSha}?recursive=1`);
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const data = await res.json();
  const all = Array.isArray(data.tree) ? data.tree : [];
  return all.filter((e: { type: string }) => e.type === "blob").map((e: { path: string; sha: string; mode: string }) => ({ path: e.path, sha: e.sha, mode: e.mode }));
}

// GitHub Contents/blob base64 comes newline-wrapped; decode as UTF-8 (skill text may be non-ASCII).
function decodeBase64(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

function ghError(status: number): { error: string } {
  if (status === 403) return { error: "PAT lacks the required scopes. The token needs Contents: write and Pull requests: write." };
  if (status === 404) return { error: "Repo not found, or the PAT can't access it." };
  return { error: `GitHub ${status}` };
}
