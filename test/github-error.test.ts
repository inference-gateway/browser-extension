import { describe, expect, test } from "bun:test";
import { githubError } from "../src/shared/messages";

describe("githubError", () => {
  test("surfaces GitHub's message instead of a bare status", () => {
    expect(githubError(422, JSON.stringify({ message: "Invalid tree info" })))
      .toBe("GitHub 422: Invalid tree info");
  });

  test("folds the errors array into the message", () => {
    const body = JSON.stringify({
      message: "Reference update failed",
      errors: [{ resource: "Reference", code: "custom", message: "Object does not exist" }],
    });
    expect(githubError(422, body)).toBe("GitHub 422: Reference update failed - Object does not exist");
  });

  test("describes errors that carry only a field and code", () => {
    const body = JSON.stringify({ message: "Validation Failed", errors: [{ field: "sha", code: "missing_field" }] });
    expect(githubError(422, body)).toBe("GitHub 422: Validation Failed - sha missing_field");
  });

  test("falls back to raw text, then to the bare status", () => {
    expect(githubError(502, "upstream boom")).toBe("GitHub 502: upstream boom");
    expect(githubError(502, "")).toBe("GitHub 502");
  });
});
