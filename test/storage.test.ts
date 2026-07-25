import { beforeEach, expect, test } from "bun:test";
import * as storage from "../src/shared/storage";
import { DEFAULT_BOT } from "../src/shared/models";

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

test("tokenFor picks the exact owner match only", () => {
  const entries = [
    { owner: "", token: "blank" },
    { owner: "acme", token: "acme-tok" },
  ];
  expect(storage.tokenFor("acme", entries)).toBe("acme-tok");
  expect(storage.tokenFor("other", entries)).toBeUndefined();
});

test("tokenFor returns undefined when no owner match", () => {
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

const acmeBot = { enabled: true, clientId: "Iv1", privateKeySecret: "ACME_KEY" };

test("botFor picks the exact owner match, else DEFAULT_BOT", () => {
  const entries = [{ owner: "acme", ...acmeBot }];
  expect(storage.botFor("acme", entries)).toEqual(acmeBot);
  expect(storage.botFor("other", entries)).toEqual(DEFAULT_BOT);
  expect(storage.botFor("acme", [])).toEqual(DEFAULT_BOT);
});

test("saveBots trims, drops empty disabled rows, and clears the legacy bot key", async () => {
  await storage.set("bot", { enabled: true, clientId: "old", privateKeySecret: "OLD" });
  await storage.saveBots([
    { owner: "  acme ", enabled: true, clientId: "  Iv1  ", privateKeySecret: " ACME_KEY " },
    { owner: "empty", enabled: false, clientId: "  ", privateKeySecret: "APP_PRIVATE_KEY" },
    { owner: "keep", enabled: false, clientId: "Iv2", privateKeySecret: "K" },
  ]);
  expect(await storage.get("bots")).toEqual([
    { owner: "acme", enabled: true, clientId: "Iv1", privateKeySecret: "ACME_KEY" },
    { owner: "keep", enabled: false, clientId: "Iv2", privateKeySecret: "K" },
  ]);
  expect(await storage.get("bot")).toBeUndefined();
});

test("loadBots migrates a legacy bot object into a blank-owner entry", async () => {
  await storage.set("bot", acmeBot);
  expect(await storage.loadBots()).toEqual([{ owner: "", ...acmeBot }]);
});

test("loadBots prefers the bots list over the legacy bot", async () => {
  await storage.set("bot", { enabled: true, clientId: "legacy", privateKeySecret: "L" });
  await storage.set("bots", [{ owner: "acme", ...acmeBot }]);
  expect(await storage.loadBots()).toEqual([{ owner: "acme", ...acmeBot }]);
});
