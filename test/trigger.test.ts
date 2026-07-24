import { expect, test } from "bun:test";
import { getTrigger } from "../src/lib/dom";

// getTrigger only reads .value and .selectionStart, so a plain object stands in.
const box = (value: string, pos = value.length) =>
  ({ value, selectionStart: pos }) as HTMLTextAreaElement;

test("fires on '!' at input start", () => {
  expect(getTrigger(box("!go"))).toEqual({ index: 0, query: "go" });
});

test("fires on '!' after whitespace", () => {
  expect(getTrigger(box("hey !g"))).toEqual({ index: 4, query: "g" });
});

test("does not fire mid-word (avoids 'Hello!')", () => {
  expect(getTrigger(box("Hello!"))).toBeNull();
});

test("bare '!' opens with empty query", () => {
  expect(getTrigger(box("!"))).toEqual({ index: 0, query: "" });
});

test("closes once a space follows the token", () => {
  expect(getTrigger(box("!go "))).toBeNull();
});
