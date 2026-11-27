/** Applies architectural conventions to studio sources and fails on violations. */
import { readdir, readFile } from "node:fs/promises";
import { inspectSource } from "./architecture-rules.mjs";

/** Visits TypeScript/Vue sources in the requested directory tree. */
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
    "Architecture: boundaries, primitives, responsibility headers and file sizes are valid.",
  );
