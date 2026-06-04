import { parseDocument } from "htmlparser2";
import render from "dom-serializer";
import type { InjectResult } from "./transform-jsx.js";

/**
 * Inject data-source into Vue3 SFC `<template>` elements.
 *
 * Uses `@vue/compiler-sfc` to parse the SFC and extract the template block,
 * then `htmlparser2` to inject attributes and serialize back.
 *
 * @vue/compiler-sfc is loaded dynamically so React-only users don't need it.
 */
export async function injectVueDataSource(
  code: string,
  filePath: string
): Promise<InjectResult> {
  let parseSFC: any;
  try {
    const mod = await import("@vue/compiler-sfc" as string);
    parseSFC = mod.parse;
  } catch {
    return { code, map: null };
  }

  const { descriptor } = parseSFC(code, { filename: filePath });
  const templateBlock = descriptor.template;
  if (!templateBlock) {
    return { code, map: null };
  }

  const content = templateBlock.content;

  // Parse template content as HTML (preserving Vue-specific attributes / casing)
  const dom = parseDocument(content, {
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
    recognizeSelfClosing: true,
    withStartIndices: true,
    withEndIndices: true,
  });

  // Walk DOM tree and inject data-source on every element
  walkDom(dom, (node: any) => {
    const line = offsetToLine(content, node.startIndex ?? 0);
    node.attribs = node.attribs || {};
    if (!node.attribs["data-source"]) {
      node.attribs["data-source"] = `${filePath}:${line}`;
    }
  });

  // Serialize back to HTML string
  const newContent = render(dom, { encodeEntities: false });

  // Re-assemble SFC: replace only the content inside <template>...</template>
  // templateBlock.loc covers the raw content (between the template tags).
  const contentStart = templateBlock.loc.start.offset;
  const contentEnd = templateBlock.loc.end.offset;
  const before = code.slice(0, contentStart);
  const after = code.slice(contentEnd);

  const newCode = before + "\n" + newContent + after;
  return { code: newCode, map: null };
}

function walkDom(node: any, cb: (node: any) => void) {
  if (!node) return;
  if (node.type === "tag") {
    cb(node);
  }
  if (node.children) {
    for (const child of node.children) {
      walkDom(child, cb);
    }
  }
}

function offsetToLine(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === "\n") line++;
  }
  return line;
}
