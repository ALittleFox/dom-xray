import { loadConfig } from "./config/index.js";
import type { PluginConfig, BundlerAdapter } from "./types.js";

let config: PluginConfig | null = null;

export function getConfig(cwd?: string): PluginConfig {
  if (!config) {
    config = loadConfig(cwd);
  }
  return config;
}

export function createPlugin(adapter: BundlerAdapter, cwd?: string) {
  const cfg = getConfig(cwd);
  // Adapter-specific factory logic can be placed here.
  return { config: cfg, adapter };
}

export * from "./config/index.js";
export * from "./types.js";
export * from "./server/index.js";
export * from "./transform/index.js";
export * from "./agent/index.js";
export { default as domSelectorLoader, domSelectorLoaderPath } from "./loader/index.js";
