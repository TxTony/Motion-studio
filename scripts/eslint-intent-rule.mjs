/** Requires intent comments on named source functions through a focused local lint rule. */
export const intentRule = {
  meta: {
    type: "suggestion",
    schema: [],
    messages: {
      missing: "Briefly describe the intent of this named function.",
    },
  },
  /** Inspects named declarations without requiring comments on trivial callbacks. */
  create(context) {
    const source = context.sourceCode;
    /** Finds the declaration's intent comment, including comments before an export. */
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
      /** Identifies arrow functions exposed through named declarations. */
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
