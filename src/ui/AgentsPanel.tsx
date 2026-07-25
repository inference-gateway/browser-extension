import { AgentsTab } from "./AgentsTab";

// Popover for the "Agents" repo-nav button - its own panel, sibling to the Tasks and Skills popovers.
export function AgentsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="igw-tasks-panel">
      <div className="igw-tasks-header">
        <button className="igw-tasks-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="igw-tasks-body">
        <AgentsTab />
      </div>
    </div>
  );
}
