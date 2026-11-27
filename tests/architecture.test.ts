/** Vérifie que le garde-fou architectural refuse les dérives demandées par le PO. */
import { describe, it, expect } from "vitest";
// @ts-expect-error Le module de script est exécuté directement par Node, sans déclaration TS séparée.
import { inspectSource } from "../scripts/architecture-rules.mjs";
describe("conventions exécutables", () => {
  it("refuse un moteur importé par le domaine", () => {
    expect(
      inspectSource(
        "src/domain/clip.ts",
        '/** Clips. */\nimport {Vector3} from "three";',
      ),
    ).not.toEqual([]);
  });
  it("refuse un champ natif hors du dossier forms", () => {
    expect(
      inspectSource(
        "src/components/domain/BadPanel.vue",
        "<!-- Vue. -->\n<template><input /></template>",
      ),
    ).not.toEqual([]);
  });
  it("refuse une session dépendante de Vue", () => {
    expect(
      inspectSource(
        "src/application/session.ts",
        '/** Session. */\nimport {ref} from "vue";',
      ),
    ).not.toEqual([]);
  });
  it("refuse les fichiers TypeScript de plus de 500 lignes", () => {
    expect(
      inspectSource(
        "src/domain/long.ts",
        "/** Responsabilité. */\n".repeat(501),
      ),
    ).not.toEqual([]);
  });
  it("accepte les primitives à leur emplacement prévu", () => {
    expect(
      inspectSource(
        "src/components/forms/StudioTextField.vue",
        "<!-- Champ texte. -->\n<template><input /></template>",
      ),
    ).toEqual([]);
  });
});
