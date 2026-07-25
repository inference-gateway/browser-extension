import { expect, test } from "bun:test";
import { taskBody, taskTitle } from "../src/shared/task";

test("taskBody prepends the @opentask trigger when missing", () => {
  expect(taskBody("fix the login bug")).toBe("@opentask\n\nfix the login bug");
});

test("taskBody keeps an existing @opentask trigger", () => {
  expect(taskBody("@opentask review this PR")).toBe("@opentask review this PR");
});

test("taskTitle derives from the first line, stripping the trigger", () => {
  expect(taskTitle("@opentask fix the login bug\nmore detail")).toBe("fix the login bug");
});

test("taskTitle falls back for a bare trigger and truncates long input", () => {
  expect(taskTitle("@opentask")).toBe("OpenTask task");
  expect(taskTitle("x".repeat(100)).length).toBe(80);
});
