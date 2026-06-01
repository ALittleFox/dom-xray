import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import type { PluginConfig } from "./types";

const require = createRequire(import.meta.url);

export function loadConfig(cwd: string = process.cwd()): PluginConfig {
  const configFile = path.resolve(cwd, "dom-selector.config.json");
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
    if (pkg.domSelector && typeof pkg.domSelector === "object") {
      return pkg.domSelector as PluginConfig;
    }
  }

  return {};
}

export function resolveClientPath(): string {
  try {
    return require.resolve("@dom-selector/overlay-ui/dist/client.js");
  } catch {
    const overlayPkg = path.resolve(
      process.cwd(),
      "packages/overlay-ui/dist/client.js"
    );
    if (fs.existsSync(overlayPkg)) {
      return overlayPkg;
    }
    throw new Error("[dom-selector] Cannot resolve overlay-ui client bundle.");
  }
}
