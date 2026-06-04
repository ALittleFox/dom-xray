import MagicString from "magic-string";
import type { InjectResult } from "./transform-jsx.js";

/**
 * Inject data-source into Svelte component elements.
 *
 * Supports Svelte 5 (modern) AST via `svelte/compiler.parse(code, { modern: true })`.
 * Uses `magic-string` to precisely insert attributes at element positions.
 *
 * `svelte/compiler` is loaded dynamically so Vue/React-only users don't need it.
 */
export async function injectSvelteDataSource(
  code: string,
  filePath: string
): Promise<InjectResult> {
  let svelteCompiler: any;
  try {
    svelteCompiler = await import("svelte/compiler" as string);
  } catch {
    return { code, map: null };
  }

  // Svelte 5 parse API
  let ast: any;
  try {
    ast = svelteCompiler.parse(code, { modern: true });
  } catch {
    return { code, map: null };
  }

  const s = new MagicString(code);

  // Walk the AST fragment (Svelte 5: ast.fragment; Svelte 4: ast.html)
  const root = ast.fragment || ast.html;
  if (!root) {
    return { code, map: null };
  }

  walkSvelteAst(root, (node: any) => {
    if (node.type !== "RegularElement" && node.type !== "Element") return;

    const start: number = node.start;
    const line = offsetToLine(code, start);

    // Find the element name in the source: e.g. <button ...>
    const slice = code.slice(start);
    const match = slice.match(/^<([a-zA-Z][a-zA-Z0-9-]*)/);
    if (!match) return;

    const nameEnd = start + match[0].length;
    s.appendRight(nameEnd, ` data-source="${filePath}:${line}"`);
  });

  return { code: s.toString(), map: null };
}

function walkSvelteAst(node: any, cb: (node: any) => void) {
  if (!node) return;
  cb(node);

  // Svelte 5: fragment.nodes, element.children, block.children
  const children = node.nodes || node.children;
  if (children) {
    for (const child of children) {
      walkSvelteAst(child, cb);
    }
  }

  // Svelte control flow / conditional blocks
  if (node.else) walkSvelteAst(node.else, cb);
  if (node.expression) walkSvelteAst(node.expression, cb);
  if (node.alternate) walkSvelteAst(node.alternate, cb);
  if (node.consequent) walkSvelteAst(node.consequent, cb);
}

function offsetToLine(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === "\n") line++;
  }
  return line;
}
