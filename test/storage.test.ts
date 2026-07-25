import { beforeEach, expect, test } from "bun:test";
import * as storage from "../src/shared/storage";

let store: Record<string, unknown>;

beforeEach(() => {
  store = {};
  (globalThis as Record<string, unknown>).chrome = {
    storage: {
      local: {
        get: async (key: string) => (key in store ? { [key]: store[key] } : {}),
        set: async (obj: Record<string, unknown>) => {
          Object.assign(store, obj);
        },
        remove: async (key: string) => {
          delete store[key];
        },
      },
    },
  };
});

test("set then get round-trips a value", async () => {
  await storage.set("pat", "github_pat_abc");
  expect(await storage.get<string>("pat")).toBe("github_pat_abc");
});

test("remove deletes the key", async () => {
  await storage.set("pat", "github_pat_abc");
  await storage.remove("pat");
  expect(await storage.get<string>("pat")).toBeUndefined();
});

test("tokenFor picks the exact owner match, else the blank-owner default", () => {
  const entries = [
    { owner: "", token: "default" },
    { owner: "acme", token: "acme-tok" },
  ];
  expect(storage.tokenFor("acme", entries)).toBe("acme-tok");
  expect(storage.tokenFor("other", entries)).toBe("default");
});

test("tokenFor returns undefined when no owner match and no default", () => {
  expect(storage.tokenFor("acme", [{ owner: "beta", token: "t" }])).toBeUndefined();
  expect(storage.tokenFor("acme", [])).toBeUndefined();
});

test("saveTokens trims, drops blank tokens, and clears the legacy pat key", async () => {
  await storage.set("pat", "legacy");
  await storage.saveTokens([
    { owner: "  acme ", token: "  tok  " },
    { owner: "empty", token: "  " },
  ]);
  expect(await storage.get("pats")).toEqual([{ owner: "acme", token: "tok" }]);
  expect(await storage.get<string>("pat")).toBeUndefined();
});

test("loadTokens migrates a legacy pat into a blank-owner default entry", async () => {
  await storage.set("pat", "github_pat_abc");
  expect(await storage.loadTokens()).toEqual([{ owner: "", token: "github_pat_abc" }]);
});

test("loadTokens prefers the pats list over the legacy pat", async () => {
  await storage.set("pat", "legacy");
  await storage.set("pats", [{ owner: "acme", token: "tok" }]);
  expect(await storage.loadTokens()).toEqual([{ owner: "acme", token: "tok" }]);
});
