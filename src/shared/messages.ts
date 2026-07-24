// Typed contract for the content <-> background message channel.
export type Skill = { name: string };

export type SkillsRequest = { type: "skills"; owner: string; repo: string };

export type SkillsResponse = { items: Skill[] } | { error: string };
