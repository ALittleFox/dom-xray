import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";

const traverse = (traverseModule as any).default || traverseModule;
const gen = (generate as any).default || generate;

export interface InjectResult {
  code: string;
  map: any | null;
}

export interface InjectJSXOptions {
  /** If provided, injects a `<script dangerouslySetInnerHTML>` into `<body>` (layout files only). */
  scriptContent?: string;
}

/**
 * Parse source code and inject `data-source` attribute into every JSX element.
 * The value is `"filePath:startLine"` so the overlay can jump to the exact source.
 *
 * Supports React, SolidJS, and Vue3 JSX (all use the same JSX AST).
 *
 * For layout files (`layout.tsx` / `layout.jsx`), an optional `scriptContent` can be
 * injected as an inline `<script>` child of `<body>`. This is needed for Next.js
 * App Router + Turbopack, where module-level side-effects in Server Components do
 * not execute on the client.
 */
export function injectJSXDataSource(
  code: string,
  filePath: string,
  options?: InjectJSXOptions
): InjectResult {
  let ast: t.File;
  try {
    ast = parse(code, {
      sourceType: "module",
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: [
        "jsx",
        "typescript",
        "decorators-legacy",
        "classProperties",
        "dynamicImport",
        "optionalChaining",
        "nullishCoalescingOperator",
      ],
    });
  } catch {
    // If parsing fails (e.g. non-JSX file), return unchanged
    return { code, map: null };
  }

  const isLayout = /layout\.(tsx|jsx)$/.test(filePath);
  const shouldInjectScript = isLayout && !!options?.scriptContent;

  (traverse as any)(ast, {
    JSXOpeningElement(path: any) {
      const node = path.node as t.JSXOpeningElement;
      const line = node.loc?.start?.line ?? 1;

      const attrName = "data-source";
      const alreadyHas = node.attributes.some(
        (attr: any) =>
          t.isJSXAttribute(attr) &&
          t.isJSXIdentifier(attr.name) &&
          attr.name.name === attrName
      );
      if (!alreadyHas) {
        const value = `${filePath}:${line}`;
        node.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier(attrName),
            t.stringLiteral(value)
          )
        );
      }

      // Inject inline script into <body> for layout files
      if (
        shouldInjectScript &&
        t.isJSXIdentifier(node.name) &&
        node.name.name === "body"
      ) {
        const jsxElement = path.parent;
        if (t.isJSXElement(jsxElement)) {
          const scriptElement = t.jsxElement(
            t.jsxOpeningElement(
              t.jsxIdentifier("script"),
              [
                t.jsxAttribute(
                  t.jsxIdentifier("dangerouslySetInnerHTML"),
                  t.jsxExpressionContainer(
                    t.objectExpression([
                      t.objectProperty(
                        t.identifier("__html"),
                        t.stringLiteral(options!.scriptContent!)
                      ),
                    ])
                  )
                ),
              ],
              true
            ),
            null,
            []
          );
          // Prepend script with surrounding whitespace for readability
          jsxElement.children.unshift(t.jsxText("\n"));
          jsxElement.children.unshift(scriptElement);
          jsxElement.children.unshift(t.jsxText("\n"));
        }
      }
    },
  });

  const result = gen(ast);
  return { code: result.code, map: null };
}
