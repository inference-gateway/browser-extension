import type { ReactNode } from "react";

// The filterable checkbox list that SkillsTab and AgentsTab both reimplemented: a search
// box plus a list of checkbox rows. Presentational only — callers own filtering/ranking
// (they pass already-filtered `items`) and the per-row label. Keeps the .igw-* classes so
// it stays themed by GitHub's CSS variables inside the injected overlay.
export function CheckList<T>({
  items,
  keyOf,
  checked,
  onToggle,
  renderLabel,
  search,
  onSearch,
  searchPlaceholder,
  hint,
  emptyText = "No matches.",
}: {
  items: T[];
  keyOf: (item: T) => string;
  checked: (item: T) => boolean;
  onToggle: (item: T) => void;
  renderLabel: (item: T) => ReactNode;
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder: string;
  hint?: ReactNode;
  emptyText?: string;
}) {
  return (
    <>
      <input
        className="igw-tasks-search"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />
      {hint}
      <div className="igw-skill-list">
        {items.length === 0 && <p className="igw-tasks-muted">{emptyText}</p>}
        {items.map((item) => (
          <label key={keyOf(item)} className="igw-skill-row">
            <input type="checkbox" checked={checked(item)} onChange={() => onToggle(item)} />
            <span className="igw-skill-text">{renderLabel(item)}</span>
          </label>
        ))}
      </div>
    </>
  );
}
