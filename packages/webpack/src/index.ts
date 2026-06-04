import type { Compiler, WebpackPluginInstance } from "webpack";
import fs from "node:fs";
import { loadConfig, resolveClientPath, domSelectorLoaderPath } from "@dom-selector/core";
import type { PluginConfig } from "@dom-selector/core";

const PLUGIN_NAME = "DOMSelectorWebpackPlugin";

export interface DOMSelectorWebpackOptions extends PluginConfig {}

export class DOMSelectorPlugin implements WebpackPluginInstance {
  private options: DOMSelectorWebpackOptions;
  private clientPath: string;

  constructor(options?: DOMSelectorWebpackOptions) {
    this.options = options || {};
    this.clientPath = resolveClientPath();
  }

  apply(compiler: Compiler) {
    const isDev =
      compiler.options.mode === "development" ||
      process.env.NODE_ENV === "development";
    if (!isDev) return;

    // Merge config from file
    const fileConfig = loadConfig(compiler.context);
    const config = { ...fileConfig, ...this.options };

    // Inject client as additional entry
    compiler.options.entry = injectEntry(
      compiler.options.entry,
      this.clientPath
    );

    // Define global constants for the client
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

    // Collect sources and serve via devServer middleware or hook
    const moduleSources = new Map<string, { code: string; path: string }>();

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

    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.afterOptimizeModules.tap(PLUGIN_NAME, (modules) => {
        for (const mod of modules) {
          const m = mod as any;
          if (!m.resource) continue;
          if (m.resource.includes("node_modules")) continue;
          // Exclude the injected client bundle itself
          if (m.resource.includes("overlay-ui") && m.resource.includes("client.js")) continue;
          // Only collect source files (JS/TS/Vue/Svelte), not CSS/assets
          if (!/\.(js|jsx|ts|tsx|vue|svelte)$/.test(m.resource)) continue;
          try {
            const raw = fs.readFileSync(m.resource, "utf-8");
            moduleSources.set(m.resource, {
              code: raw,
              path: m.resource,
            });
          } catch {
            // ignore files that cannot be read from disk
          }
        }
      });
    });

    compiler.hooks.afterPlugins.tap(PLUGIN_NAME, () => {
      const devServer = (compiler as any).options.devServer || {};
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
      (compiler as any).options.devServer = devServer;
    });
  }
}

function getDevServerBase(compiler: Compiler): string {
  const devServer = (compiler as any).options.devServer || {};
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

  app.post("/__dom-selector/api/submit", expressJson(), async (req: any, res: any) => {
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

function expressJson() {
  return (req: any, res: any, next: any) => {
    if (req.headers["content-type"] !== "application/json") {
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

export default DOMSelectorPlugin;
