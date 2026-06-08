import fs from "node:fs";
import path from "node:path";

export interface PluginConfig {
  title?: string;
  hotkey?: { mac?: string; win?: string };
  clickSelector?: string | false;
  targetFilePatterns?: string[];
  onSubmit?: "return" | string | ((data: any) => void | Promise<void>);
  editor?: string;
  agentConfig?: { type: string; options?: Record<string, any> };
}

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
    return require.resolve("@dom-xray/overlay-ui/dist/client.js", {
      paths: [process.cwd()],
    });
  } catch {
    // ignore
  }

  // 2. Try resolving from this module's directory
  try {
    return require.resolve("@dom-xray/overlay-ui/dist/client.js");
  } catch {
    // ignore
  }

  // 3. Fallback: assume monorepo structure
  return path.resolve(__dirname, "../../../packages/overlay-ui/dist/client.js");
}
