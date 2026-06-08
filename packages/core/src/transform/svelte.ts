import MagicString from "magic-string";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import type { InjectResult } from "./jsx.js";

/**
 * Inject data-source into Svelte component elements.
 *
 * Supports Svelte 5 (modern) AST via `svelte/compiler.parse(code, { modern: true })`.
 * Uses `magic-string` to precisely insert attributes at element positions.
 *
 * `svelte/compiler` is resolved from the target project's node_modules so
 * core does not need to declare it as a dependency.
 */
export async function injectSvelteDataSource(
  code: string,
  filePath: string
): Promise<InjectResult> {
  let sveltePath: string;
  try {
    const req = createRequire(dirname(filePath) + "/package.json");
    sveltePath = req.resolve("svelte/compiler");
  } catch {
    try {
      const req = createRequire(process.cwd() + "/package.json");
      sveltePath = req.resolve("svelte/compiler");
    } catch {
      return { code, map: null };
    }
  }

  let svelteCompiler: any;
  try {
    const mod = await import(sveltePath);
    svelteCompiler = mod.default || mod;
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

  // Svelte 5: fragment.nodes, element.fragment, element.children, block.children
  const children = node.nodes || node.children;
  if (children) {
    for (const child of children) {
      walkSvelteAst(child, cb);
    }
  }

  // Svelte 5 RegularElement stores children in fragment.nodes
  if (node.fragment) walkSvelteAst(node.fragment, cb);

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
