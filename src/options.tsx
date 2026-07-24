// Options page: optional PAT (private repos) and the editable quick-prompts list.
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import * as storage from "./shared/storage";
import { DEFAULT_PROMPTS, type Prompt } from "./shared/prompts";

function Options() {
  const [pat, setPat] = useState("");
  const [promptsText, setPromptsText] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void (async () => {
      setPat((await storage.get<string>("pat")) ?? "");
      const p = (await storage.get<Prompt[]>("prompts")) ?? DEFAULT_PROMPTS;
      setPromptsText(JSON.stringify(p, null, 2));
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
    await storage.set("pat", pat.trim());
    await storage.set("prompts", parsed);
    setStatus("Saved.");
  }

  function reset() {
    setPromptsText(JSON.stringify(DEFAULT_PROMPTS, null, 2));
    setStatus("Reset to defaults (not yet saved).");
  }

  return (
    <div className="igw-options">
      <h1>GitHub Comment Helper</h1>

      <section>
        <h2>Personal access token (optional)</h2>
        <p>Only needed to list skills in <strong>private</strong> repos. Fine-grained token with
          <code> Contents: read</code>. Stored in this browser's extension storage.</p>
        <input
          type="password"
          className="igw-field"
          placeholder="github_pat_..."
          value={pat}
          onChange={(e) => setPat(e.target.value)}
        />
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
