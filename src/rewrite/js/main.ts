import { parseScript } from "meriyah";
import { walk } from "estree-walker";
import { generate } from "astring";

function rewriteJS(input) {
  const unsafeGlobals = {
    parent:"$$parent",
    top: "$$top",
    location:"$$location",
    eval:"$$eval"
  };

  const scopeRefs = ["window", "globalThis", "top", "parent", "self"];
  const ast = parseScript(input);
  const aliases = new Map();

  //@ts-expect-error
  walk(ast, {
    enter(node, parent) {
      // some websites use debuggers to be annoying
      if (node.type === "DebuggerStatement") {
        this.replace({ type: "EmptyStatement" });
        return;
      }

      if (
        node.type === "VariableDeclarator" &&
        node.init?.type === "Identifier" &&
        scopeRefs.includes(node.init.name)
      ) {
        // just get ts to shut up
        if (node.id?.type === "Identifier") {
          aliases.set(node.id.name, node.init.name);
        } else {
          console.error("Error in JS rewriting: Could not track an alias");
        }
        return;
      }

      if (node.type === "CallExpression") {
        if (node.callee.type === "Identifier") {
          const name = node.callee.name;
          const original = aliases.get(name) || name;
          if (
            scopeRefs.includes(original) &&
            Object.hasOwn(unsafeGlobals, original)
          ) {
            node.callee.name = unsafeGlobals[original];
          }
        } else if (
          node.callee.type === "MemberExpression" &&
          !node.callee.computed &&
          node.callee.object.type === "Identifier"
        ) {
          const base =
            aliases.get(node.callee.object.name) || node.callee.object.name;
          // TODO - make it not use as any
          const prop = (node.callee.property as any).name;
          if (scopeRefs.includes(base) && Object.hasOwn(unsafeGlobals, prop)) {
            (node.callee.property as any).name = unsafeGlobals[prop];
          }
        }
        return;
      }

      if (node.type === "Identifier") {
        const original = aliases.get(node.name) || node.name;
        if (Object.hasOwn(unsafeGlobals, original)) {
          const isDeclaration =
            (parent?.type === "VariableDeclarator" && parent.id === node) ||
            (parent?.type === "FunctionDeclaration" && parent.id === node) ||
            (parent?.type === "FunctionExpression" && parent.id === node) ||
            (parent?.type === "ClassDeclaration" && parent.id === node) ||
            (parent?.type === "ClassExpression" && parent.id === node) ||
            parent?.type?.startsWith("Import") ||
            parent?.type?.startsWith("Export") ||
            (parent?.type === "Property" &&
              parent.key === node &&
              !parent.computed) ||
            parent?.type === "ObjectPattern";

          if (!isDeclaration && scopeRefs.includes(original)) {
            node.name = unsafeGlobals[original];
          }
        }
        return;
      }

      // rewrite *ONLY* if base is a global
      if (
        node.type === "MemberExpression" &&
        node.object.type === "Identifier"
      ) {
        const base = aliases.get(node.object.name) || node.object.name;

        if (!node.computed && node.property.type === "Identifier") {
          const prop = node.property.name;
          if (scopeRefs.includes(base) && Object.hasOwn(unsafeGlobals, prop)) {
            node.property.name = unsafeGlobals[prop];
          }
        }

        if (
          node.computed &&
          node.property.type === "Literal" &&
          typeof node.property.value === "string"
        ) {
          const prop = node.property.value;
          if (scopeRefs.includes(base) && Object.hasOwn(unsafeGlobals, prop)) {
            this.replace({ type: "Identifier", name: unsafeGlobals[prop] });
          }
        }
      }
    },
  });

  return generate(ast);
}

export { rewriteJS };
