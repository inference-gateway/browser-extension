// Typed contract for the content <-> background message channel.
export type Skill = { name: string };

export type SkillsRequest = { type: "skills"; owner: string; repo: string };

export type SkillsResponse = { items: Skill[] } | { error: string };

// Popup install messages
export type CheckInstallRequest = { type: "check-install"; owner: string; repo: string };
export type CheckInstallResponse = { installed: boolean; url?: string } | { error: string };

export type InstallRequest = { type: "install"; owner: string; repo: string };
export type InstallResponse = { prUrl: string } | { error: string };
