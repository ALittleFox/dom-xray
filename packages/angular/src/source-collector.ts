import fs from "node:fs";
import path from "node:path";

export interface SourceEntry {
  filePath: string;
  source: string;
}

const SOURCE_EXTS = new Set([".ts", ".html", ".css", ".scss"]);

const IGNORE_PATTERNS = [
  /node_modules/,
  /[\\/]dist[\\/]/,
  /\.angular/,
  /\.git/,
  /\.d\.ts$/,
];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some((p) => p.test(filePath));
}

function isSourceFile(filePath: string): boolean {
  return SOURCE_EXTS.has(path.extname(filePath));
}

function collectFromDir(dir: string, entries: SourceEntry[]): void {
  if (!fs.existsSync(dir)) return;
  let items: fs.Dirent[];
  try {
    items = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (shouldIgnore(fullPath)) continue;
    if (item.isDirectory()) {
      collectFromDir(fullPath, entries);
    } else if (item.isFile() && isSourceFile(fullPath)) {
      try {
        const source = fs.readFileSync(fullPath, "utf-8");
        entries.push({ filePath: fullPath, source });
      } catch {
        // ignore
      }
    }
  }
}

let cachedSources: SourceEntry[] | null = null;
let cachedCwd: string | null = null;

export function collectSources(cwd?: string): SourceEntry[] {
  const root = cwd || process.cwd();
  if (cachedSources && cachedCwd === root) {
    return cachedSources;
  }

  const entries: SourceEntry[] = [];
  const srcDir = path.join(root, "src");

  if (fs.existsSync(srcDir)) {
    collectFromDir(srcDir, entries);
  }

  const seen = new Set<string>();
  cachedSources = entries.filter((e) => {
    if (seen.has(e.filePath)) return false;
    seen.add(e.filePath);
    return true;
  });
  cachedCwd = root;

  return cachedSources;
}

export function clearSourceCache(): void {
  cachedSources = null;
  cachedCwd = null;
}
