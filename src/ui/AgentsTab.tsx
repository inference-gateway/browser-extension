import { useEffect, useMemo, useState } from "react";
import type { AgentManifest } from "../shared/agents";
import * as storage from "../shared/storage";
import { ask } from "./ask";

type Status =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; catalog: AgentManifest[] };

export function AgentsTab() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    void storage.get<string[]>("selected-agents").then((names) => {
      if (Array.isArray(names)) setSelected(new Set(names));
    });
    ask({ type: "agents-catalog" }, (resp) => {
      if (chrome.runtime?.lastError || !resp)
        return setStatus({ kind: "error", message: "Failed to load agents." });
      if (resp.error)
        return setStatus({ kind: "error", message: resp.error });
      const catalog = (resp as { catalog: AgentManifest[] }).catalog;
      setStatus({ kind: "ready", catalog });
    });
  }, []);

  // Checking an agent persists it to storage; the Install panel's "Re-install
  // workflow" button feeds these names to infer-action's `agents:` input.
  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      void storage.set("selected-agents", [...next]);
      return next;
    });
  }

  const filtered = useMemo(() => {
    if (status.kind !== "ready") return [];
    const q = query.trim().toLowerCase();
    if (!q) return status.catalog;
    return status.catalog.filter((a) => {
      const text = `${a.metadata.name} ${a.metadata.description} ${a.metadata.version}`.toLowerCase();
      return text.includes(q);
    });
  }, [status, query]);

  if (status.kind === "loading")
    return <p className="igw-tasks-muted">Loading agents…</p>;
  if (status.kind === "error")
    return <p className="igw-tasks-error">{status.message}</p>;

  return (
    <>
      <input
        className="igw-tasks-search"
        placeholder="Search agents…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p className="igw-tasks-hint">Checked agents are added to the OpenTask workflow when you (re)install it.</p>
      <div className="igw-skill-list">
        {filtered.length === 0 && (
          <p className="igw-tasks-muted" style={{ padding: "10px 12px" }}>
            No agents match.
          </p>
        )}
        {filtered.map((agent) => (
          <label key={agent.metadata.name} className="igw-skill-row">
            <input
              type="checkbox"
              checked={selected.has(agent.metadata.name)}
              onChange={() => toggle(agent.metadata.name)}
            />
            <span className="igw-skill-text">
              <span className="igw-skill-name">
                {agent.metadata.name}
                <span className="igw-skill-badge">
                  v{agent.metadata.version}
                </span>
              </span>
              <span className="igw-skill-desc">
                {agent.metadata.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </>
  );
}
