import { expect, test } from "bun:test";
import { taskBody, taskTitle } from "../src/shared/task";

test("taskBody prepends the @infer trigger when missing", () => {
  expect(taskBody("fix the login bug")).toBe("@infer\n\nfix the login bug");
});

test("taskBody keeps an existing @infer trigger", () => {
  expect(taskBody("@infer review this PR")).toBe("@infer review this PR");
});

test("taskTitle derives from the first line, stripping the trigger", () => {
  expect(taskTitle("@infer fix the login bug\nmore detail")).toBe("fix the login bug");
});

test("taskTitle falls back for a bare trigger and truncates long input", () => {
  expect(taskTitle("@infer")).toBe("Infer task");
  expect(taskTitle("x".repeat(100)).length).toBe(80);
});
