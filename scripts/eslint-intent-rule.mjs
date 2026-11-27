/** Règle locale limitée : exige un commentaire d’intention pour les fonctions nommées des sources. */
export const intentRule = {
  meta: {
    type: "suggestion",
    schema: [],
    messages: {
      missing: "Décrire brièvement l’intention de cette fonction nommée.",
    },
  },
  /** Analyse les déclarations nommées, sans imposer de commentaire aux callbacks triviaux. */
  create(context) {
    const source = context.sourceCode;
    /** Recherche le commentaire associé à la déclaration, y compris devant un export. */
    function requireIntent(node) {
      let target = node;
      if (target.type === "VariableDeclarator") target = target.parent;
      if (target.parent?.type === "ExportNamedDeclaration")
        target = target.parent;
      if (
        !source
          .getCommentsBefore(target)
          .some((comment) => comment.value.trim().length > 8)
      )
        context.report({ node, messageId: "missing" });
    }
    return {
      FunctionDeclaration: requireIntent,
      MethodDefinition: requireIntent,
      /** Identifie les fonctions fléchées qui constituent des contrats nommés. */
      VariableDeclarator(node) {
        if (
          ["ArrowFunctionExpression", "FunctionExpression"].includes(
            node.init?.type,
          )
        )
          requireIntent(node);
      },
    };
  },
};
