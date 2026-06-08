import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import type { PluginConfig } from "../types";

export function loadConfig(cwd: string = process.cwd()): PluginConfig {
  const configFile = path.resolve(cwd, "dom-xray.config.json");
  if (fs.existsSync(configFile)) {
    const content = fs.readFileSync(configFile, "utf-8");
    return JSON.parse(content) as PluginConfig;
  }

  const pkgFile = path.resolve(cwd, "package.json");
  if (fs.existsSync(pkgFile)) {
    const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf-8")) as Record<
      string,
      unknown
    >;
    if (pkg.domXray && typeof pkg.domXray === "object") {
      return pkg.domXray as PluginConfig;
    }
  }

  return {};
}

export function resolveClientPath(): string {
  // 1. Try resolving from the current working directory (end-user project)
  try {
    const req = createRequire(path.resolve(process.cwd(), "package.json"));
    return req.resolve("@dom-xray/overlay-ui/dist/client.js");
  } catch {
    // ignore
  }

  // 2. Fallback: resolve relative to this module's location (monorepo)
  const coreDir = path.dirname(fileURLToPath(import.meta.url));
  const overlayPath = path.resolve(coreDir, "../../overlay-ui/dist/client.js");
  if (fs.existsSync(overlayPath)) {
    return overlayPath;
  }

  // 3. Final fallback: cwd-based monorepo guess
  const cwdPath = path.resolve(process.cwd(), "packages/overlay-ui/dist/client.js");
  if (fs.existsSync(cwdPath)) {
    return cwdPath;
  }

  throw new Error("[dom-xray] Cannot resolve overlay-ui client bundle.");
}
