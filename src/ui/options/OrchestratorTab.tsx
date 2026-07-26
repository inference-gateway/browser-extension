import type { Permissions, RefineConfig, InitConfig } from "../../shared/models";
import { Section, ToggleRow } from "./Section";

export function OrchestratorTab({
  perms,
  setPerms,
  refine,
  setRefine,
  init,
  setInit,
}: {
  perms: Permissions;
  setPerms: (p: Permissions) => void;
  refine: RefineConfig;
  setRefine: (r: RefineConfig) => void;
  init: InitConfig;
  setInit: (i: InitConfig) => void;
}) {
  return (
    <>
      <Section
        title="Agent permissions"
        description={
          <>
            What the OpenTask agent may do while a task runs. These widen infer-action's read-only
            baseline; unchecked capabilities stay blocked. <strong>Re-install the workflow</strong> after
            changing these.
          </>
        }
      >
        <ToggleRow checked={perms.createPRs} onChange={(v) => setPerms({ ...perms, createPRs: v })}>
          Create pull requests (commit &amp; push)
        </ToggleRow>
        <ToggleRow checked={perms.createIssues} onChange={(v) => setPerms({ ...perms, createIssues: v })}>
          Create GitHub issues
        </ToggleRow>
        <ToggleRow checked={perms.comment} onChange={(v) => setPerms({ ...perms, comment: v })}>
          Comment on issues &amp; pull requests
        </ToggleRow>
      </Section>

      <Section
        title="Issue refinement"
        description={
          <>
            Let the OpenTask agent rewrite an issue's description in place. Refine edits the issue body
            via <code>gh issue edit</code>, so the installed workflow needs <code>Create GitHub issues</code>{" "}
            permission above - <strong>re-install</strong> after enabling.
          </>
        }
      >
        <ToggleRow checked={refine.manual} onChange={(v) => setRefine({ ...refine, manual: v })}>
          Show a Refine button on issue pages
        </ToggleRow>
        <ToggleRow checked={refine.auto} onChange={(v) => setRefine({ ...refine, auto: v })}>
          Auto-refine issues you create on GitHub
        </ToggleRow>
      </Section>

      <Section
        title="Project init"
        description={
          <>
            What the <strong>Init</strong> button (in a repo's nav) asks the agent to scaffold. It always
            generates an <code>AGENTS.md</code> and opens a PR; these add optional extras. Requires the
            OpenTask Agent workflow to be installed on the repo.
          </>
        }
      >
        <ToggleRow checked={init.githooks} onChange={(v) => setInit({ ...init, githooks: v })}>
          Add a <code>.githooks/pre-commit</code> hook
        </ToggleRow>
        <ToggleRow checked={init.claudeSymlink} onChange={(v) => setInit({ ...init, claudeSymlink: v })}>
          Symlink <code>CLAUDE.md</code> &rarr; <code>AGENTS.md</code>
        </ToggleRow>
        <ToggleRow checked={init.skillsSymlink} onChange={(v) => setInit({ ...init, skillsSymlink: v })}>
          Symlink <code>.claude/skills</code> &rarr; <code>.agents/skills</code>
        </ToggleRow>
      </Section>
    </>
  );
}
