import { expect, test } from "bun:test";
import { fuzzyFilter } from "../src/lib/fuzzy";

const id = (s: string) => s;

test("matches subsequence in order, rejects non-subsequence", () => {
  const got = fuzzyFilter(["go", "golang", "cli"], "go", id).map((r) => r.item);
  expect(got).toContain("go");
  expect(got).toContain("golang");
  expect(got).not.toContain("cli");
});

test("ranks start-anchored / contiguous higher", () => {
  const got = fuzzyFilter(["agone", "go"], "go", id).map((r) => r.item);
  expect(got[0]).toBe("go");
});

test("empty query keeps every item", () => {
  expect(fuzzyFilter(["a", "b", "c"], "  ", id).length).toBe(3);
});

test("no match yields empty result", () => {
  expect(fuzzyFilter(["abc"], "xyz", id).length).toBe(0);
});

test("returns highlight positions of matched chars", () => {
  const [r] = fuzzyFilter(["operator"], "opr", id);
  expect(r.positions).toEqual([0, 1, 3]); // o, p, (era) r
});
