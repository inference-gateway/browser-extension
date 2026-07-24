import { useEffect, useMemo, useState } from "react";
import { suggestForLanguages, type CatalogSkill } from "../shared/skills";
import { ask } from "./ask";

type Loaded = { catalog: CatalogSkill[]; installed: string[]; languages: string[] };
type Status = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; data: Loaded };
type Apply = { kind: "idle" } | { kind: "applying" } | { kind: "done"; url: string } | { kind: "error"; message: string };

// Multi-select skills list: checked = installed. Applying opens one PR that adds the newly
// checked skills' folders and removes the unchecked-but-installed ones under .agents/skills/.
export function SkillsTab({ owner, repo }: { owner: string; repo: string }) {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [apply, setApply] = useState<Apply>({ kind: "idle" });

  useEffect(() => {
    ask({ type: "skills-catalog", owner, repo }, (resp) => {
      if (chrome.runtime?.lastError || !resp) return setStatus({ kind: "error", message: "Failed to load skills." });
      if (resp.error) return setStatus({ kind: "error", message: resp.error });
      const data = resp as unknown as Loaded;
      const inst = new Set(data.installed);
      setInstalled(inst);
      setSelected(new Set(inst));
      setStatus({ kind: "ready", data });
    });
  }, [owner, repo]);

  const ranked = useMemo(() => {
    if (status.kind !== "ready") return [];
    const ordered = suggestForLanguages(status.data.catalog, status.data.languages);
    const q = query.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter((o) => {
      const s = o.skill;
      return `${s.name} ${s.description} ${s.tags.join(" ")} ${s.categories.join(" ")}`.toLowerCase().includes(q);
    });
  }, [status, query]);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const add = [...selected].filter((n) => !installed.has(n));
  const remove = [...installed].filter((n) => !selected.has(n));
  const dirty = add.length > 0 || remove.length > 0;

  function applyChanges() {
    if (!dirty) return;
    setApply({ kind: "applying" });
    ask({ type: "apply-skills", owner, repo, add, remove }, (resp) => {
      if (chrome.runtime?.lastError || !resp) return setApply({ kind: "error", message: "Failed to apply." });
      if (resp.error) return setApply({ kind: "error", message: resp.error });
      setApply({ kind: "done", url: resp.prUrl as string });
    });
  }

  if (status.kind === "loading") return <p className="igw-tasks-muted">Loading skills…</p>;
  if (status.kind === "error") return <p className="igw-tasks-error">{status.message}</p>;

  const langs = status.data.languages;
  return (
    <>
      <input
        className="igw-tasks-search"
        placeholder="Search skills…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {langs.length > 0 && <p className="igw-tasks-hint">Suggested for {langs.join(", ")}</p>}
      <div className="igw-skill-list">
        {ranked.length === 0 && <p className="igw-tasks-muted">No skills match.</p>}
        {ranked.map(({ skill, suggested }) => (
          <label key={skill.name} className="igw-skill-row">
            <input type="checkbox" checked={selected.has(skill.name)} onChange={() => toggle(skill.name)} />
            <span className="igw-skill-text">
              <span className="igw-skill-name">
                {skill.name}
                {suggested && <span className="igw-skill-badge">suggested</span>}
                {installed.has(skill.name) && <span className="igw-skill-badge igw-skill-badge-on">installed</span>}
              </span>
              <span className="igw-skill-desc">{skill.description}</span>
            </span>
          </label>
        ))}
      </div>
      <button className="igw-tasks-btn" onClick={applyChanges} disabled={!dirty || apply.kind === "applying"}>
        {apply.kind === "applying" ? "Opening PR…" : dirty ? `Apply changes (+${add.length} / −${remove.length})` : "No changes"}
      </button>
      {apply.kind === "done" && (
        <p className="igw-tasks-success">
          PR opened - <a className="igw-tasks-link" href={apply.url} target="_blank" rel="noopener noreferrer">view PR</a>
        </p>
      )}
      {apply.kind === "error" && <p className="igw-tasks-error">{apply.message}</p>}
    </>
  );
}
