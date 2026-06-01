import { loadConfig } from "./config.js";
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

export * from "./config.js";
export * from "./types.js";
export * from "./server.js";
