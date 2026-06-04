import fs from "node:fs";
import { loadConfig, resolveClientPath, domSelectorLoaderPath } from "@dom-selector/core";
import type { PluginConfig } from "@dom-selector/core";

const PLUGIN_NAME = "DOMSelectorRspackPlugin";

export interface DOMSelectorRspackOptions extends PluginConfig {}

export class DOMSelectorRspackPlugin {
  private options: DOMSelectorRspackOptions;
  private clientPath: string;

  constructor(options?: DOMSelectorRspackOptions) {
    this.options = options || {};
    this.clientPath = resolveClientPath();
  }

  apply(compiler: any) {
    const isDev =
      compiler.options.mode === "development" ||
      process.env.NODE_ENV === "development";
    if (!isDev) return;

    const fileConfig = loadConfig(compiler.context || process.cwd());
    const config = { ...fileConfig, ...this.options };

    // Inject client entry
    compiler.options.entry = injectEntry(
      compiler.options.entry,
      this.clientPath
    );

    // Inject pre-loader for JSX/Vue/Svelte files to add data-source attributes
    compiler.options.module = compiler.options.module || {};
    compiler.options.module.rules = compiler.options.module.rules || [];
    (compiler.options.module.rules as any[]).unshift({
      enforce: "pre",
      test: /\.(jsx|tsx|vue|svelte)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: domSelectorLoaderPath,
        },
      ],
    });

    // Define globals
    const { DefinePlugin } = compiler.webpack;
    new DefinePlugin({
      __DOM_SELECTOR_CONFIG__: JSON.stringify({
        title: config.title,
        hotkey: config.hotkey,
        clickSelector: config.clickSelector,
        targetFilePatterns: config.targetFilePatterns,
        editor: config.editor || "vscode",
      }),
      __DOM_SELECTOR_API__: JSON.stringify(
        `${getDevServerBase(compiler)}/__dom-selector`
      ),
    }).apply(compiler);

    // Collect sources
    const moduleSources = new Map<string, { code: string; path: string }>();
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation: any) => {
      compilation.hooks.afterOptimizeModules.tap(
        PLUGIN_NAME,
        (modules: any) => {
          for (const mod of modules) {
            if (!mod.resource) continue;
            if (mod.resource.includes("node_modules")) continue;
            // Exclude the injected client bundle itself
            if (mod.resource.includes("overlay-ui") && mod.resource.includes("client.js")) continue;
            // Only collect source files (JS/TS/Vue/Svelte), not CSS/assets
            if (!/\.(js|jsx|ts|tsx|vue|svelte)$/.test(mod.resource)) continue;
            try {
              const raw = fs.readFileSync(mod.resource, "utf-8");
              moduleSources.set(mod.resource, {
                code: raw,
                path: mod.resource,
              });
            } catch {
              // ignore files that cannot be read from disk
            }
          }
        }
      );
    });

    // Register devServer middlewares
    compiler.hooks.afterPlugins.tap(PLUGIN_NAME, () => {
      const devServer = compiler.options.devServer || {};
      const originalSetupMiddlewares =
        devServer.setupMiddlewares || ((m: any) => m);
      devServer.setupMiddlewares = (
        middlewares: any,
        devServerCtx: any
      ) => {
        const app = devServerCtx.app || devServerCtx;
        mountMiddlewares(app, config, moduleSources);
        return originalSetupMiddlewares(middlewares, devServerCtx);
      };
      compiler.options.devServer = devServer;
    });
  }
}

function getDevServerBase(compiler: any): string {
  const devServer = compiler.options.devServer || {};
  const host = devServer.host || "localhost";
  const port = devServer.port || 8080;
  return `http://${host}:${port}`;
}

function injectEntry(entry: any, clientPath: string): any {
  if (typeof entry === "string") {
    return { main: [clientPath, entry] };
  }
  if (Array.isArray(entry)) {
    return [clientPath, ...entry];
  }
  if (typeof entry === "object" && entry !== null) {
    const result: any = {};
    for (const [key, val] of Object.entries(entry)) {
      if (typeof val === "string") {
        result[key] = [clientPath, val];
      } else if (Array.isArray(val)) {
        result[key] = [clientPath, ...val];
      } else if (val && typeof val === "object") {
        const importArr = (val as any).import || [];
        result[key] = {
          ...val,
          import: [clientPath, ...(Array.isArray(importArr) ? importArr : [importArr])],
        };
      } else {
        result[key] = val;
      }
    }
    return result;
  }
  return entry;
}

function mountMiddlewares(
  app: any,
  config: PluginConfig,
  moduleSources: Map<string, { code: string; path: string }>
) {
  app.get("/__dom-selector/api/sources", (_req: any, res: any) => {
    const sources = Array.from(moduleSources.values()).map((m) => ({
      filePath: m.path,
      source: m.code,
    }));
    res.json(sources);
  });

  app.post("/__dom-selector/api/submit", jsonBody(), async (req: any, res: any) => {
    const data = req.body;
    if (typeof config.onSubmit === "function") {
      try {
        await config.onSubmit(data);
        res.json({ ok: true });
        return;
      } catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
        return;
      }
    }
    res.json({ ok: true, data });
  });
}

function jsonBody() {
  return (req: any, res: any, next: any) => {
    if (req.method !== "POST") {
      next();
      return;
    }
    let body = "";
    req.on("data", (chunk: any) => (body += chunk));
    req.on("end", () => {
      try {
        req.body = JSON.parse(body);
        next();
      } catch {
        next();
      }
    });
  };
}

export default DOMSelectorRspackPlugin;
