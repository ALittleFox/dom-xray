/// <reference types="nuxt" />
import fs from "node:fs";
import path from "node:path";

function getCachePath(): string {
  return path.join(process.cwd(), ".nuxt", "dom-selector-cache.json");
}

export default defineEventHandler(() => {
  try {
    const cachePath = getCachePath();
    const data = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    return data;
  } catch {
    return [];
  }
});
