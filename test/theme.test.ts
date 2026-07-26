import { expect, test } from "bun:test";
import { resolveDark } from "../src/shared/theme";

test("explicit light/dark ignore the OS preference", () => {
  expect(resolveDark("dark", false)).toBe(true);
  expect(resolveDark("dark", true)).toBe(true);
  expect(resolveDark("light", true)).toBe(false);
  expect(resolveDark("light", false)).toBe(false);
});

test("system follows the OS preference", () => {
  expect(resolveDark("system", true)).toBe(true);
  expect(resolveDark("system", false)).toBe(false);
});
