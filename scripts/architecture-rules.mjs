/** Checks architectural boundaries and file placement independently of the lint engine. */
import ts from "typescript";

const browserIdentifiers = new Set([
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLVideoElement",
  "Blob",
  "File",
]);

/** Detects actual browser identifiers while ignoring comments and string literals. */
function usesBrowserApi(file, source) {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let found = false;
  /** Visits syntax nodes without interpreting prose as program references. */
  function visit(node) {
    if (ts.isIdentifier(node) && browserIdentifiers.has(node.text))
      found = true;
    else if (!found) ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return found;
}

/** Returns targeted violations without changing the inspected source. */
export function inspectSource(file, source) {
  const errors = [];
  if (!source.trimStart().startsWith(file.endsWith(".vue") ? "<!--" : "/**"))
    errors.push("Missing responsibility header.");
  if (source.trimEnd().split(/\r?\n/).length > 500)
    errors.push("TypeScript/Vue files must not exceed 500 lines.");
  const imports = Array.from(
    source.matchAll(/\b(?:from|import)\s*['"]([^'"]+)['"]/g),
    (match) => match[1],
  );
  if (file.startsWith("src/domain/")) {
    if (
      imports.some(
        (path) =>
          !path.startsWith(".") ||
          /(infrastructure|application|composables|components|views)\//.test(
            path,
          ),
      )
    )
      errors.push("The domain may depend only on its own modules.");
  }
  if (file.startsWith("src/application/")) {
    if (
      imports.some(
        (path) =>
          !path.startsWith(".") ||
          /(infrastructure|composables|components|views)\//.test(path),
      )
    )
      errors.push(
        "The application may depend only on the domain and its ports.",
      );
  }
  if (/^src\/(domain|application)\//.test(file) && usesBrowserApi(file, source))
    errors.push("Browser APIs are not allowed in the testable core.");
  if (file.endsWith(".vue")) {
    if (/<button\b/i.test(source) && !file.startsWith("src/components/core/"))
      errors.push("Use StudioButton; native buttons belong in core.");
    if (
      /<(input|textarea)\b/i.test(source) &&
      !file.startsWith("src/components/forms/")
    )
      errors.push("Native fields belong in components/forms.");
    if (
      /<select\b/i.test(source) &&
      !file.startsWith("src/components/selectors/")
    )
      errors.push("Native selectors belong in components/selectors.");
  }
  if (/\bv-html\b|\binnerHTML\s*=/.test(source))
    errors.push("Compose views with components instead of generated HTML.");
  return errors;
}
