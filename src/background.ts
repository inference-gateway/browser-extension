// Service worker: the one place the cross-origin GitHub fetch is allowed to live
// (Chrome MV3 subjects content-script fetch to the page CSP; the worker is exempt),
// and the shared per-repo cache. Content script talks to it via runtime messaging.
import * as storage from "./shared/storage";
import type { Skill } from "./shared/messages";

const TTL = 10 * 60 * 1000; // 10 min

const WORKFLOW_PATH = ".github/workflows/infer-agent.yml";
const BRANCH = "infer-agent-install";

const WORKFLOW_YAML = `name: Infer Agent
on:
  issue_comment:
    types: [created]
  issues:
    types: [opened, labeled]

jobs:
  infer:
    runs-on: ubuntu-latest
    steps:
      - uses: inference-gateway/infer-action@v1
        with:
          github-token: \${{ secrets.GITHUB_TOKEN }}
          provider-api-key: \${{ secrets.INFER_PROVIDER_API_KEY }}
          model: \${{ secrets.INFER_MODEL || 'claude-sonnet-4-20250514' }}
`;

const PR_BODY = `## Infer Agent workflow

This PR adds the Infer Agent workflow to this repository. It uses [inference-gateway/infer-action](https://github.com/inference-gateway/infer-action) to run the Infer agent on issues and pull requests.

### Setup

Before the workflow can run, you need to add a repository secret:

1. Go to Settings > Secrets and variables > Actions
2. Add \`INFER_PROVIDER_API_KEY\` with your provider API key
3. (Optional) Add \`INFER_MODEL\` to override the default model

The workflow triggers on issue comments, new issues, and labeled issues.

Resolves #17
`;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "check-install") {
    checkInstall(msg.owner, msg.repo)
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }
  if (msg?.type === "install") {
    doInstall(msg.owner, msg.repo)
      .then((r) => sendResponse(r))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }
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

async function ghFetch(owner: string, repo: string, path: string, init?: RequestInit): Promise<Response> {
  const pat = await storage.get<string>("pat");
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (pat) headers.Authorization = `Bearer ${pat}`;
  if (init?.headers) Object.assign(headers, init.headers);
  return fetch(`https://api.github.com/repos/${owner}/${repo}/${path}`, { ...init, headers });
}

async function checkInstall(owner: string, repo: string): Promise<{ installed: boolean; url?: string } | { error: string }> {
  const pat = await storage.get<string>("pat");
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

async function doInstall(owner: string, repo: string): Promise<{ prUrl: string } | { error: string }> {
  const pat = await storage.get<string>("pat");
  if (!pat) return { error: "No PAT configured. Add a fine-grained token with Contents: write, Pull requests: write, and Workflows: write in the extension options." };

  // 1. Get default branch and head SHA
  const repoRes = await ghFetch(owner, repo, "");
  if (!repoRes.ok) {
    if (repoRes.status === 403) return { error: "PAT lacks the required scopes. The token needs Contents: write, Pull requests: write, and Workflows: write." };
    throw new Error(`GitHub ${repoRes.status}`);
  }
  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch;
  const headSha = repoData.head?.sha ?? (await ghFetch(owner, repo, `git/refs/heads/${defaultBranch}`).then((r) => r.json())).object.sha;

  // 2. Create branch
  const branchRes = await ghFetch(owner, repo, "git/refs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref: `refs/heads/${BRANCH}`, sha: headSha }),
  });
  if (!branchRes.ok && branchRes.status !== 422) {
    // 422 = branch already exists, that's fine
    if (branchRes.status === 403) return { error: "PAT lacks the required scopes. The token needs Contents: write, Pull requests: write, and Workflows: write." };
    throw new Error(`GitHub ${branchRes.status}`);
  }

  // 3. PUT workflow file
  const content = btoa(WORKFLOW_YAML);
  const putRes = await ghFetch(owner, repo, `contents/${WORKFLOW_PATH}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "feat: add Infer Agent workflow",
      content,
      branch: BRANCH,
    }),
  });
  if (!putRes.ok) {
    if (putRes.status === 403) return { error: "PAT lacks the required scopes. The token needs Contents: write, Pull requests: write, and Workflows: write." };
    throw new Error(`GitHub ${putRes.status}`);
  }

  // 4. Open PR
  const prRes = await ghFetch(owner, repo, "pulls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "feat: add Infer Agent workflow",
      head: BRANCH,
      base: defaultBranch,
      body: PR_BODY,
    }),
  });
  if (!prRes.ok) {
    if (prRes.status === 403) return { error: "PAT lacks the required scopes. The token needs Pull requests: write." };
    throw new Error(`GitHub ${prRes.status}`);
  }
  const prData = await prRes.json();
  return { prUrl: prData.html_url };
}
