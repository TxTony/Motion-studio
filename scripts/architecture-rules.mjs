/** Vérifie les frontières et conventions de rangement indépendamment du moteur de lint. */
/** Retourne les violations ciblées d’un fichier sans modifier son contenu. */
export function inspectSource(file, source) {
  const errors = [];
  if (!source.trimStart().startsWith(file.endsWith(".vue") ? "<!--" : "/**"))
    errors.push("En-tête de responsabilité absent.");
  if (source.trimEnd().split(/\r?\n/).length > 500)
    errors.push("Plus de 500 lignes dans un fichier TS/Vue.");
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
      errors.push("Le domaine ne dépend que de ses propres modules.");
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
        "L’application dépend du domaine et de ses ports uniquement.",
      );
  }
  const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
  if (
    /^src\/(domain|application)\//.test(file) &&
    /\b(window|document|navigator|HTMLElement|HTMLVideoElement|Blob|File)\b/.test(
      code,
    )
  )
    errors.push("API navigateur interdite dans le cœur testable.");
  if (file.endsWith(".vue")) {
    if (/<button\b/i.test(source) && !file.startsWith("src/components/core/"))
      errors.push("Utiliser StudioButton ; bouton natif réservé à core.");
    if (
      /<(input|textarea)\b/i.test(source) &&
      !file.startsWith("src/components/forms/")
    )
      errors.push("Champ natif réservé à components/forms.");
    if (
      /<select\b/i.test(source) &&
      !file.startsWith("src/components/selectors/")
    )
      errors.push("Sélecteur natif réservé à components/selectors.");
  }
  if (/\bv-html\b|\binnerHTML\s*=/.test(source))
    errors.push("Composer la vue avec des composants, sans HTML généré.");
  return errors;
}
