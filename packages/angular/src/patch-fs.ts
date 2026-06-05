import fs from "node:fs";
import { injectHtmlDataSource } from "./html-injector";

let patched = false;

function extractQuotedString(
  text: string,
  startIndex: number
): { content: string; endIndex: number; quote: string } | null {
  const quote = text[startIndex];
  if (quote !== `"` && quote !== `'` && quote !== "`") return null;

  let i = startIndex + 1;
  let content = "";
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\") {
      content += ch + text[i + 1];
      i += 2;
      continue;
    }
    if (ch === quote) {
      return { content, endIndex: i, quote };
    }
    content += ch;
    i++;
  }
  return null;
}

/**
 * Inject data-source into inline Angular templates inside .ts files.
 * Looks for @Component decorators with `template:` property.
 */
function injectInlineTemplates(code: string, filePath: string): string {
  if (!code.includes("@Component") || !code.includes("template")) {
    return code;
  }

  let modified = code;
  let offset = 0;

  // Find all occurrences of `template:` followed by a string
  // Use word boundary to avoid matching templateUrl etc.
  const regex = /\btemplate\s*:\s*/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(code)) !== null) {
    const strStart = match.index + match[0].length;
    const extracted = extractQuotedString(code, strStart);
    if (!extracted) continue;

    const { content, endIndex, quote } = extracted;
    // Only process backtick template strings that look like HTML
    if (quote !== "`") continue;
    const trimmed = content.trim();
    if (!trimmed.startsWith("<") || !trimmed.includes(">")) continue;

    const injected = injectHtmlDataSource(content, filePath).code;
    if (injected !== content) {
      const before = modified.slice(0, strStart + offset);
      const after = modified.slice(endIndex + 1 + offset);
      modified = before + quote + injected + quote + after;
      offset += injected.length - content.length;
    }
  }

  return modified;
}

/**
 * Monkey-patch fs.readFileSync to inject data-source attributes into
 * Angular HTML template files and inline templates in .ts files
 * before the Angular compiler reads them.
 */
export function patchFsReadFile(): void {
  if (patched) return;
  patched = true;

  const original = fs.readFileSync;

  (fs as any).readFileSync = function (
    path: fs.PathOrFileDescriptor,
    options?: { encoding?: string | null; flag?: string } | string | null
  ): string | Buffer {
    const result = original.apply(this, arguments as any);

    if (typeof path !== "string" || path.includes("node_modules")) {
      return result;
    }

    const encoding =
      typeof options === "string" ? options : options?.encoding;
    const isStringResult = typeof result === "string";
    const content = isStringResult
      ? result
      : (result as Buffer).toString("utf-8");

    let modified: string | null = null;

    if (path.endsWith(".html")) {
      modified = injectHtmlDataSource(content, path).code;
    } else if (
      path.endsWith(".ts") &&
      !path.endsWith(".spec.ts") &&
      !path.endsWith(".d.ts")
    ) {
      // Only process files that actually have inline templates
      if (content.includes("@Component") && /\btemplate\s*:\s*[`\"']/.test(content)) {
        modified = injectInlineTemplates(content, path);
      }
    }

    if (modified !== null && modified !== content) {
      if (encoding) {
        return modified;
      }
      return Buffer.from(modified);
    }

    return result;
  };
}

// Auto-patch when this module is loaded in Node.js
patchFsReadFile();
