/** Verifies that architecture checks reject the contribution-rule violations specified by the PO. */
import { describe, it, expect } from "vitest";
// @ts-expect-error This script module runs directly in Node without a separate TypeScript declaration.
import { inspectSource } from "../scripts/architecture-rules.mjs";
describe("executable contribution rules", () => {
  it("does not mistake English text for a browser API reference", () => {
    expect(
      inspectSource(
        "src/domain/message.ts",
        '/** Message text. */\nexport const message = "File too large";',
      ),
    ).toEqual([]);
  });
  it("still rejects actual browser API types in the domain", () => {
    expect(
      inspectSource(
        "src/domain/upload.ts",
        "/** Upload boundary. */\nexport type Upload = File;",
      ),
    ).not.toEqual([]);
  });
  it("rejects engine imports in the domain", () => {
    expect(
      inspectSource(
        "src/domain/clip.ts",
        '/** Clips. */\nimport {Vector3} from "three";',
      ),
    ).not.toEqual([]);
  });
  it("rejects native fields outside the forms directory", () => {
    expect(
      inspectSource(
        "src/components/domain/BadPanel.vue",
        "<!-- Vue. -->\n<template><input /></template>",
      ),
    ).not.toEqual([]);
  });
  it("rejects a session that depends on Vue", () => {
    expect(
      inspectSource(
        "src/application/session.ts",
        '/** Session. */\nimport {ref} from "vue";',
      ),
    ).not.toEqual([]);
  });
  it("rejects TypeScript files exceeding 500 lines", () => {
    expect(
      inspectSource(
        "src/domain/long.ts",
        "/** Responsibility. */\n".repeat(501),
      ),
    ).not.toEqual([]);
  });
  it("accepts primitives in their assigned directories", () => {
    expect(
      inspectSource(
        "src/components/forms/StudioTextField.vue",
        "<!-- Text field. -->\n<template><input /></template>",
      ),
    ).toEqual([]);
  });
});
