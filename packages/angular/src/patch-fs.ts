import fs from "node:fs";
import { injectHtmlDataSource } from "./html-injector";

let patched = false;

/**
 * Monkey-patch fs.readFileSync to inject data-source attributes into
 * Angular HTML template files before the Angular compiler reads them.
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

    if (
      typeof path === "string" &&
      path.endsWith(".html") &&
      !path.includes("node_modules")
    ) {
      const encoding =
        typeof options === "string" ? options : options?.encoding;
      const isStringResult = typeof result === "string";
      const content = isStringResult
        ? result
        : (result as Buffer).toString("utf-8");
      const modified = injectHtmlDataSource(content, path).code;

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
