/** Applique les conventions architecturales aux sources du studio et échoue sur toute violation. */
import { readdir, readFile } from "node:fs/promises";
import { inspectSource } from "./architecture-rules.mjs";

/** Parcourt les seuls fichiers source TypeScript/Vue de l’arborescence donnée. */
async function inspectDirectory(directory) {
  let count = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      count += await inspectDirectory(file);
      continue;
    }
    if (!/\.(ts|vue)$/.test(file)) continue;
    const errors = inspectSource(file, await readFile(file, "utf8"));
    for (const error of errors) console.error(`${file}: ${error}`);
    count += errors.length;
  }
  return count;
}
const violations = await inspectDirectory("src");
if (violations) process.exitCode = 1;
else
  console.log(
    "Architecture : frontières, primitives, en-têtes et taille des fichiers conformes.",
  );
