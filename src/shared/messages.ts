import type { AgentManifest } from "./agents";
import type { CatalogSkill } from "./skills";

export type Skill = { name: string };

export type SkillsRequest = { type: "skills"; owner: string; repo: string };

export type SkillsResponse = { items: Skill[] } | { error: string };

export type CheckInstallRequest = { type: "check-install"; owner: string; repo: string };
export type CheckInstallResponse = { installed: boolean; url?: string } | { error: string };

export type InstallRequest = { type: "install"; owner: string; repo: string; model: string };
export type InstallResponse = { prUrl: string } | { error: string };

export type CreateTaskRequest = { type: "create-task"; owner: string; repo: string; prompt: string };
export type CreateTaskResponse = { url: string } | { error: string };

// Run a free-text task without opening an issue: dispatch the installed workflow, which
// passes the prompt to infer-action's direct-prompt input.
export type DispatchTaskRequest = { type: "dispatch-task"; owner: string; repo: string; model: string; prompt: string };
export type DispatchTaskResponse = { url: string } | { error: string };

// Refine one existing issue: dispatch the workflow with a refine prompt for issue #N. Uses
// the first configured model as default (no model picker at the call sites).
export type RefineIssueRequest = { type: "refine-issue"; owner: string; repo: string; issue: number };
export type RefineIssueResponse = { url: string } | { error: string };

// Scaffold a repo: dispatch the installed workflow to generate AGENTS.md (+ optional
// githooks/symlinks per the global "init" config) and open a PR.
export type InitProjectRequest = { type: "init-project"; owner: string; repo: string };
export type InitProjectResponse = { url: string } | { error: string };

// Skills registry: the full catalog, the names already installed in the repo's
// .agents/skills/, and the repo's top languages (for suggestion ordering).
export type SkillsCatalogRequest = { type: "skills-catalog"; owner: string; repo: string };
export type SkillsCatalogResponse =
  | { catalog: CatalogSkill[]; installed: string[]; languages: string[] }
  | { error: string };

export type ApplySkillsRequest = { type: "apply-skills"; owner: string; repo: string; add: string[]; remove: string[] };
export type ApplySkillsResponse = { prUrl: string } | { error: string };

export type AgentsCatalogRequest = { type: "agents-catalog" };
export type AgentsCatalogResponse =
  | { catalog: AgentManifest[] }
  | { error: string };
