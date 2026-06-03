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

/**
 * Parse source code and inject `data-source` attribute into every JSX element.
 * The value is `"filePath:startLine"` so the overlay can jump to the exact source.
 */
export function injectDataSource(
  code: string,
  filePath: string
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
      if (alreadyHas) return;

      const value = `${filePath}:${line}`;
      node.attributes.push(
        t.jsxAttribute(
          t.jsxIdentifier(attrName),
          t.stringLiteral(value)
        )
      );
    },
  });

  const result = gen(ast);
  return { code: result.code, map: null };
}
