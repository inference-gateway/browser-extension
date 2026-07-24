import { expect, test } from "bun:test";
import { parseSource, suggestForLanguages, isCatalogSkill, type CatalogSkill } from "../src/shared/skills";

const skill = (over: Partial<CatalogSkill>): CatalogSkill => ({
  name: "x",
  description: "",
  source: "",
  tags: [],
  categories: [],
  ...over,
});

test("parseSource handles the registry tree URL", () => {
  expect(parseSource("https://github.com/inference-gateway/skills/tree/main/skills/adl")).toEqual({
    owner: "inference-gateway",
    repo: "skills",
    ref: "main",
    path: "skills/adl",
  });
});

test("parseSource handles an external repo pinned to a tag", () => {
  expect(parseSource("https://github.com/Xquik-dev/x-twitter-scraper/tree/v2.4.16/skills/x-twitter-scraper")).toEqual({
    owner: "Xquik-dev",
    repo: "x-twitter-scraper",
    ref: "v2.4.16",
    path: "skills/x-twitter-scraper",
  });
});

test("parseSource returns null for a non-tree URL", () => {
  expect(parseSource("https://github.com/inference-gateway/skills")).toBeNull();
});

test("suggestForLanguages surfaces language-matching skills first, preserving order", () => {
  const skills = [
    skill({ name: "adl", tags: ["schema"] }),
    skill({ name: "go-fmt", description: "Format Go code", tags: ["go"] }),
    skill({ name: "ts-lint", tags: ["typescript"] }),
  ];
  const ranked = suggestForLanguages(skills, ["Go"]);
  expect(ranked.map((r) => r.skill.name)).toEqual(["go-fmt", "adl", "ts-lint"]);
  expect(ranked.find((r) => r.skill.name === "go-fmt")?.suggested).toBe(true);
  expect(ranked.find((r) => r.skill.name === "adl")?.suggested).toBe(false);
});

test("suggestForLanguages with no languages keeps original order, nothing suggested", () => {
  const skills = [skill({ name: "a" }), skill({ name: "b" })];
  const ranked = suggestForLanguages(skills, []);
  expect(ranked.map((r) => r.skill.name)).toEqual(["a", "b"]);
  expect(ranked.every((r) => !r.suggested)).toBe(true);
});

test("isCatalogSkill requires name and source strings", () => {
  expect(isCatalogSkill({ name: "a", source: "b" })).toBe(true);
  expect(isCatalogSkill({ name: "a" })).toBe(false);
  expect(isCatalogSkill(null)).toBe(false);
});
