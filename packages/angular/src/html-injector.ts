import { parseDocument } from "htmlparser2";
import render from "dom-serializer";

export interface InjectResult {
  code: string;
  changed: boolean;
}

/**
 * Inject data-source attributes into every HTML element.
 */
export function injectHtmlDataSource(
  code: string,
  filePath: string
): InjectResult {
  const dom = parseDocument(code, {
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
    recognizeSelfClosing: true,
    withStartIndices: true,
    withEndIndices: true,
  });

  let changed = false;

  walkDom(dom, (node: any, startIndex: number) => {
    const line = offsetToLine(code, startIndex);
    node.attribs = node.attribs || {};
    if (!node.attribs["data-source"]) {
      node.attribs["data-source"] = `${filePath}:${line}`;
      changed = true;
    }
  });

  return {
    code: render(dom, { encodeEntities: false }),
    changed,
  };
}

function walkDom(node: any, cb: (node: any, startIndex: number) => void) {
  if (!node) return;
  if (node.type === "tag") {
    cb(node, node.startIndex ?? 0);
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
