import { loadConfig } from "./config";
import type { PluginConfig, BundlerAdapter } from "./types";

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

export * from "./config";
export * from "./types";
export * from "./server";
