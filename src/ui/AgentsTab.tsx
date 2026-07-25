import { useEffect, useMemo, useState } from "react";
import type { AgentManifest } from "../shared/agents";
import { ask } from "./ask";

type Status =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; catalog: AgentManifest[] };

export function AgentsTab() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [query, setQuery] = useState("");

  useEffect(() => {
    ask({ type: "agents-catalog" }, (resp) => {
      if (chrome.runtime?.lastError || !resp)
        return setStatus({ kind: "error", message: "Failed to load agents." });
      if (resp.error)
        return setStatus({ kind: "error", message: resp.error as string });
      const catalog = (resp as { catalog: AgentManifest[] }).catalog;
      setStatus({ kind: "ready", catalog });
    });
  }, []);

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
      <div className="igw-skill-list">
        {filtered.length === 0 && (
          <p className="igw-tasks-muted" style={{ padding: "10px 12px" }}>
            No agents match.
          </p>
        )}
        {filtered.map((agent) => (
          <div key={agent.metadata.name} className="igw-skill-row">
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
          </div>
        ))}
      </div>
    </>
  );
}
