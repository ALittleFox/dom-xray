import fs from "node:fs";
import path from "node:path";
import { injectDataSource } from "@dom-selector/core";
import type { PluginConfig } from "@dom-selector/core";

const moduleSources = new Map<string, { code: string; path: string }>();

function getCachePath(): string {
  return path.join(process.cwd(), ".nuxt", "dom-selector-cache.json");
}

function writeCache(): void {
  const cachePath = getCachePath();
  const data = Array.from(moduleSources.values()).map((m) => ({
    filePath: m.path,
    source: m.code,
  }));
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(data), "utf-8");
}

export function domSelectorVitePlugin(_config: PluginConfig): any {
  return {
    name: "dom-selector-nuxt",
    enforce: "pre",

    async load(id: string | undefined) {
      // Only intercept JSX/TSX files directly.
      // For Vue files, data-source is injected via Vue compiler nodeTransforms
      // in the Nuxt module setup, so we just collect sources here.
      if (!id || id.startsWith("\0")) return null;
      if (id.includes("node_modules")) return null;

      // Collect source for all source files (including Vue)
      if (/\.(js|jsx|ts|tsx|vue|svelte)$/.test(id) && !id.includes("?")) {
        try {
          const raw = fs.readFileSync(id, "utf-8");
          moduleSources.set(id, { code: raw, path: id });
          writeCache();
        } catch {
          // ignore
        }
      }

      // Only return modified code for JSX/TSX (Vue handled by nodeTransforms)
      if (/\.(jsx|tsx)$/.test(id)) {
        try {
          const raw = fs.readFileSync(id, "utf-8");
          const res = await injectDataSource(raw, id);
          return res.code !== raw ? res.code : null;
        } catch {
          return null;
        }
      }

      return null;
    },

    async transform(_code: string, id: string) {
      if (id.startsWith("\0") || id.includes("node_modules")) return null;
      if (id.includes("overlay-ui") && id.includes("client.js")) return null;

      // Collect source for all transformed files
      if (/\.(js|jsx|ts|tsx|vue|svelte)$/.test(id)) {
        try {
          // Strip query params for fs read
          const cleanPath = id.split("?")[0];
          const raw = fs.readFileSync(cleanPath, "utf-8");
          moduleSources.set(cleanPath, { code: raw, path: cleanPath });
          writeCache();
        } catch {
          // ignore
        }
      }

      // Transform JSX/TSX files
      if (/\.(jsx|tsx)$/.test(id) && !id.includes("node_modules")) {
        const res = await injectDataSource(_code, id);
        return res.code;
      }

      return null;
    },
  };
}

export function getModuleSources(): { filePath: string; source: string }[] {
  return Array.from(moduleSources.values()).map((m) => ({
    filePath: m.path,
    source: m.code,
  }));
}

export function getCacheFilePath(): string {
  return getCachePath();
}
