import { useEffect, useMemo, useState } from "react";
import type { AgentManifest } from "../shared/agents";
import * as storage from "../shared/storage";
import { useAsk } from "./useAsk";
import { CheckList } from "./CheckList";

type Loaded = { catalog: AgentManifest[] };

export function AgentsTab() {
  const { status } = useAsk<Loaded>({ type: "agents-catalog" }, "Failed to load agents.", []);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    void storage.get<string[]>("selected-agents").then((names) => {
      if (Array.isArray(names)) setSelected(new Set(names));
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
    if (!q) return status.data.catalog;
    return status.data.catalog.filter((a) => {
      const text = `${a.metadata.name} ${a.metadata.description} ${a.metadata.version}`.toLowerCase();
      return text.includes(q);
    });
  }, [status, query]);

  if (status.kind === "loading") return <p className="igw-tasks-muted">Loading agents…</p>;
  if (status.kind === "error") return <p className="igw-tasks-error">{status.message}</p>;

  return (
    <CheckList
      items={filtered}
      keyOf={(a) => a.metadata.name}
      checked={(a) => selected.has(a.metadata.name)}
      onToggle={(a) => toggle(a.metadata.name)}
      search={query}
      onSearch={setQuery}
      searchPlaceholder="Search agents…"
      emptyText="No agents match."
      hint={<p className="igw-tasks-hint">Checked agents are added to the OpenTask workflow when you (re)install it.</p>}
      renderLabel={(agent) => (
          <>
            <span className="igw-skill-name">
              {agent.metadata.name}
              <span className="igw-skill-badge">v{agent.metadata.version}</span>
            </span>
            <span className="igw-skill-desc">{agent.metadata.description}</span>
        </>
      )}
    />
  );
}
