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

test("savePat stores the trimmed token", async () => {
  await storage.savePat("  github_pat_abc  ");
  expect(await storage.get<string>("pat")).toBe("github_pat_abc");
});

test("savePat with an empty string removes the key", async () => {
  await storage.set("pat", "github_pat_abc");
  await storage.savePat("");
  expect(await storage.get<string>("pat")).toBeUndefined();
});

test("savePat with only whitespace removes the key", async () => {
  await storage.set("pat", "github_pat_abc");
  await storage.savePat("   ");
  expect(await storage.get<string>("pat")).toBeUndefined();
});
