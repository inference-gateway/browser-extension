import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import * as storage from "./shared/storage";
import { DEFAULT_PROMPTS, mergePrompts, type Prompt } from "./shared/prompts";
import { DEFAULT_MODELS, DEFAULT_BOT, DEFAULT_PERMISSIONS, DEFAULT_REFINE, DEFAULT_PLUGINS, isModelOption, isBotConfig, isPermissions, isRefineConfig, isPluginOption, type BotConfig, type Permissions, type RefineConfig, type PluginOption } from "./shared/models";

type Theme = "system" | "light" | "dark";

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  if (theme === "dark") {
    html.setAttribute("data-theme", "dark");
  } else if (theme === "light") {
    html.setAttribute("data-theme", "light");
  } else {
    html.removeAttribute("data-theme");
  }
}

function Options() {
  const [pat, setPat] = useState("");
  const [promptsText, setPromptsText] = useState("");
  const [modelsText, setModelsText] = useState("");
  const [bot, setBot] = useState<BotConfig>(DEFAULT_BOT);
  const [perms, setPerms] = useState<Permissions>(DEFAULT_PERMISSIONS);
  const [refine, setRefine] = useState<RefineConfig>(DEFAULT_REFINE);
  const [plugins, setPlugins] = useState<PluginOption[]>(DEFAULT_PLUGINS);
  const [theme, setTheme] = useState<Theme>("system");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void (async () => {
      setPat((await storage.get<string>("pat")) ?? "");
      const p = mergePrompts(await storage.get<Prompt[]>("prompts"));
      setPromptsText(JSON.stringify(p, null, 2));
      const m = (await storage.get<unknown[]>("models")) ?? DEFAULT_MODELS;
      setModelsText(JSON.stringify(m, null, 2));
      const b = await storage.get<unknown>("bot");
      setBot(isBotConfig(b) ? b : DEFAULT_BOT);
      const pm = await storage.get<unknown>("permissions");
      setPerms(isPermissions(pm) ? pm : DEFAULT_PERMISSIONS);
      const rf = await storage.get<unknown>("refine");
      setRefine(isRefineConfig(rf) ? rf : DEFAULT_REFINE);
      const pl = await storage.get<unknown>("plugins");
      const stored = Array.isArray(pl) ? pl.filter(isPluginOption) : [];
      setPlugins(DEFAULT_PLUGINS.map((p) => ({ ...p, enabled: stored.find((s) => s.id === p.id)?.enabled ?? p.enabled })));
      const t = (await storage.get<string>("theme")) as Theme | undefined;
      if (t === "light" || t === "dark") {
        setTheme(t);
        applyTheme(t);
      } else {
        applyTheme("system");
      }
    })();
  }, []);

  async function save() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(promptsText);
    } catch {
      return setStatus("Prompts must be valid JSON.");
    }
    if (!Array.isArray(parsed) || !parsed.every(isPrompt)) {
      return setStatus("Prompts must be an array of { id, label, description, insert }.");
    }
    let models: unknown;
    try {
      models = JSON.parse(modelsText);
    } catch {
      return setStatus("Models must be valid JSON.");
    }
    if (!Array.isArray(models) || !models.length || !models.every(isModelOption)) {
      return setStatus("Models must be a non-empty array of { model, keyInput, secret }.");
    }
    if (bot.enabled && (!bot.clientId.trim() || !bot.privateKeySecret.trim())) {
      return setStatus("Custom Bot needs a Client ID and a private-key secret name.");
    }
    await storage.savePat(pat);
    await storage.set("prompts", parsed);
    await storage.set("models", models);
    await storage.set("bot", bot);
    await storage.set("permissions", perms);
    await storage.set("refine", refine);
    await storage.set("plugins", plugins);
    await storage.set("theme", theme);
    setStatus("Saved.");
  }

  async function removeToken() {
    setPat("");
    await storage.savePat("");
    setStatus("Token removed.");
  }

  function reset() {
    setPromptsText(JSON.stringify(DEFAULT_PROMPTS, null, 2));
    setModelsText(JSON.stringify(DEFAULT_MODELS, null, 2));
    setBot(DEFAULT_BOT);
    setPerms(DEFAULT_PERMISSIONS);
    setRefine(DEFAULT_REFINE);
    setPlugins(DEFAULT_PLUGINS);
    setStatus("Reset to defaults (not yet saved).");
  }

  return (
    <div className="igw-options">
      <h1>OpenTask settings</h1>

      <section>
        <h2>Personal access token</h2>
        <p>Required to install the Infer Agent workflow and send tasks. Also used to list
          skills in <strong>private</strong> repos. Fine-grained token with
          <code> Contents: write</code>, <code> Pull requests: write</code>,
          <code> Workflows: write</code>, <code> Issues: write</code>, and
          <code> Actions: write</code>. Stored in this browser's extension storage.</p>
        <input
          type="password"
          className="igw-field"
          placeholder="github_pat_..."
          autoComplete="off"
          value={pat}
          onChange={(e) => setPat(e.target.value)}
        />
        <div className="igw-actions">
          <a
            className="igw-save"
            href="https://github.com/settings/personal-access-tokens/new?name=OpenTask&description=OpenTask+browser+extension&contents=write&pull_requests=write&workflows=write&issues=write&actions=write"
            target="_blank"
            rel="noreferrer"
          >
            Create token
          </a>
          <button className="igw-reset" onClick={removeToken}>Remove token</button>
        </div>
      </section>

      <section>
        <h2>Quick prompts</h2>
        <p>A JSON array of <code>{"{ id, label, description, insert }"}</code>. Shown in the palette.</p>
        <textarea
          className="igw-field igw-json"
          spellCheck={false}
          value={promptsText}
          onChange={(e) => setPromptsText(e.target.value)}
        />
      </section>

      <section>
        <h2>Install models</h2>
        <p>A JSON array of <code>{"{ model, keyInput, secret }"}</code>. Offered in the toolbar popup's
          Install dropdown; the first entry is the default. <code>keyInput</code> is the
          infer-action provider-key input (e.g. <code>anthropic-api-key</code>) and
          <code> secret</code> is the repo secret it reads. Add custom models here.</p>
        <textarea
          className="igw-field igw-json"
          spellCheck={false}
          value={modelsText}
          onChange={(e) => setModelsText(e.target.value)}
        />
      </section>

      <section>
        <h2>Agent permissions</h2>
        <p>What the Infer agent may do while a task runs. These widen infer-action's read-only
          baseline; unchecked capabilities stay blocked. <strong>Re-install the workflow</strong> after
          changing these.</p>
        <div className="igw-bot-fields">
          <label className="igw-check">
            <input
              type="checkbox"
              checked={perms.createPRs}
              onChange={(e) => setPerms({ ...perms, createPRs: e.target.checked })}
            />
            Create pull requests (commit &amp; push)
          </label>
          <label className="igw-check">
            <input
              type="checkbox"
              checked={perms.createIssues}
              onChange={(e) => setPerms({ ...perms, createIssues: e.target.checked })}
            />
            Create GitHub issues
          </label>
          <label className="igw-check">
            <input
              type="checkbox"
              checked={perms.comment}
              onChange={(e) => setPerms({ ...perms, comment: e.target.checked })}
            />
            Comment on issues &amp; pull requests
          </label>
        </div>
      </section>

      <section>
        <h2>Issue refinement</h2>
        <p>Let the Infer agent rewrite an issue's description in place. Refine edits the issue
          body via <code>gh issue edit</code>, so the installed workflow needs
          <code> Create GitHub issues</code> permission above - <strong>re-install</strong> after
          enabling.</p>
        <div className="igw-bot-fields">
          <label className="igw-check">
            <input
              type="checkbox"
              checked={refine.manual}
              onChange={(e) => setRefine({ ...refine, manual: e.target.checked })}
            />
            Show a Refine button on issue pages
          </label>
          <label className="igw-check">
            <input
              type="checkbox"
              checked={refine.auto}
              onChange={(e) => setRefine({ ...refine, auto: e.target.checked })}
            />
            Auto-refine issues you create on GitHub
          </label>
        </div>
      </section>

      <section>
        <h2>Plugins</h2>
        <p>Optional <a href="https://github.com/inference-gateway/infer-action">infer-action</a> plugins
          the installed workflow pre-installs to extend the agent. All off by default; check the ones you
          want. <strong>Re-install the workflow</strong> after changing these.</p>
        <div className="igw-bot-fields">
          {plugins.map((p) => (
            <label key={p.id} className="igw-check">
              <input
                type="checkbox"
                checked={p.enabled}
                onChange={(e) => setPlugins(plugins.map((x) => (x.id === p.id ? { ...x, enabled: e.target.checked } : x)))}
              />
              <code>{p.id}</code>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2>Theme</h2>
        <p>Choose how the options page and toolbar popup are displayed.</p>
        <div className="igw-bot-fields">
          <label className="igw-check">
            <input
              type="radio"
              name="theme"
              value="system"
              checked={theme === "system"}
              onChange={() => { setTheme("system"); applyTheme("system"); }}
            />
            System default
          </label>
          <label className="igw-check">
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === "light"}
              onChange={() => { setTheme("light"); applyTheme("light"); }}
            />
            Light
          </label>
          <label className="igw-check">
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === "dark"}
              onChange={() => { setTheme("dark"); applyTheme("dark"); }}
            />
            Dark
          </label>
        </div>
      </section>

      <section>
        <h2>Custom bot</h2>
        <p>Run the agent as a GitHub App instead of <code>github-actions[bot]</code>. When
          enabled, the generated workflow mints a token with
          <code> actions/create-github-app-token@v3</code> and checks out + comments as your
          App, so its comments and commits are attributed to (and verified for) the App.</p>
        <div className="igw-actions" style={{ marginBottom: 12 }}>
          <a
            className="igw-save"
            href="https://github.com/settings/apps/new?name=OpenTask+Agent&description=OpenTask+agent+bot&contents=write&pull_requests=write&issues=write&actions=write&workflows=write"
            target="_blank"
            rel="noreferrer"
          >
            Create GitHub App
          </a>
        </div>
        <label className="igw-check">
          <input
            type="checkbox"
            checked={bot.enabled}
            onChange={(e) => setBot({ ...bot, enabled: e.target.checked })}
          />
          Use a custom bot (GitHub App)
        </label>
        {bot.enabled && (
          <div className="igw-bot-fields">
            <label className="igw-label" htmlFor="igw-bot-client-id">App Client ID</label>
            <input
              id="igw-bot-client-id"
              className="igw-field"
              placeholder="Iv23li..."
              autoComplete="off"
              value={bot.clientId}
              onChange={(e) => setBot({ ...bot, clientId: e.target.value })}
            />
            <label className="igw-label" htmlFor="igw-bot-secret">Private-key secret name</label>
            <input
              id="igw-bot-secret"
              className="igw-field"
              placeholder="APP_PRIVATE_KEY"
              autoComplete="off"
              value={bot.privateKeySecret}
              onChange={(e) => setBot({ ...bot, privateKeySecret: e.target.value })}
            />
            <p className="igw-status">Add this repo secret with your App's private key. The Client ID is inlined into the workflow (it isn't sensitive).</p>
          </div>
        )}
        <div className="igw-actions">
          <button className="igw-save" onClick={save}>Save</button>
          <button className="igw-reset" onClick={reset}>Reset to defaults</button>
          <span className="igw-status">{status}</span>
        </div>
      </section>
    </div>
  );
}

function isPrompt(p: unknown): p is Prompt {
  return (
    !!p &&
    typeof p === "object" &&
    ["id", "label", "description", "insert"].every((k) => typeof (p as Record<string, unknown>)[k] === "string")
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Options />
  </StrictMode>,
);
