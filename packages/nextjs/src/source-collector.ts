import fs from "node:fs";
import path from "node:path";

export interface SourceEntry {
  filePath: string;
  source: string;
}

const SOURCE_EXTS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".vue",
  ".svelte",
]);

const IGNORE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /[\/]dist[\/]/,
  /[\/]out[\/]/,
  /[\/]public[\/]/,
  /[\/]coverage[\/]/,
  /[\/]test[\/]/,
  /[\/]__tests__[\/]/,
  /\.git/,
  /overlay-ui[\/]dist[\/]client\.js/,
  /\.d\.ts$/,
];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some((p) => p.test(filePath));
}

function isSourceFile(filePath: string): boolean {
  return SOURCE_EXTS.has(path.extname(filePath));
}

function collectSourcesFromDir(dir: string, entries: SourceEntry[]): void {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (shouldIgnore(fullPath)) continue;

    if (item.isDirectory()) {
      collectSourcesFromDir(fullPath, entries);
    } else if (item.isFile() && isSourceFile(fullPath)) {
      try {
        const source = fs.readFileSync(fullPath, "utf-8");
        entries.push({ filePath: fullPath, source });
      } catch {
        // ignore unreadable files
      }
    }
  }
}

let cachedSources: SourceEntry[] | null = null;
let cachedCwd: string | null = null;

/**
 * Scan the project directory for source files.
 * Results are cached per cwd.
 */
export function collectSources(cwd?: string): SourceEntry[] {
  const root = cwd || process.cwd();
  if (cachedSources && cachedCwd === root) {
    return cachedSources;
  }

  const entries: SourceEntry[] = [];
  const srcDir = path.join(root, "src");
  const appDir = path.join(root, "app");
  const pagesDir = path.join(root, "pages");
  const componentsDir = path.join(root, "components");

  // Scan standard source directories
  for (const dir of [srcDir, appDir, pagesDir, componentsDir]) {
    if (fs.existsSync(dir)) {
      collectSourcesFromDir(dir, entries);
    }
  }

  // Also scan root-level source files
  const rootItems = fs.readdirSync(root, { withFileTypes: true });
  for (const item of rootItems) {
    if (item.isFile() && isSourceFile(item.name) && !shouldIgnore(item.name)) {
      const fullPath = path.join(root, item.name);
      try {
        const source = fs.readFileSync(fullPath, "utf-8");
        entries.push({ filePath: fullPath, source });
      } catch {
        // ignore
      }
    }
  }

  // Deduplicate by filePath
  const seen = new Set<string>();
  cachedSources = entries.filter((e) => {
    if (seen.has(e.filePath)) return false;
    seen.add(e.filePath);
    return true;
  });
  cachedCwd = root;

  return cachedSources;
}

/**
 * Clear the source cache. Call when files change in dev mode.
 */
export function clearSourceCache(): void {
  cachedSources = null;
  cachedCwd = null;
}
