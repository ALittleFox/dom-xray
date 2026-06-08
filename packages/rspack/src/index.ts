import fs from "node:fs";
import { loadConfig, resolveClientPath, domSelectorLoaderPath, createAgentMiddleware } from "@dom-xray/core";
import type { PluginConfig } from "@dom-xray/core";

const PLUGIN_NAME = "DomXrayRspackPlugin";

export interface DomXrayRspackOptions extends PluginConfig {}

export class DomXrayRspackPlugin {
  private options: DomXrayRspackOptions;
  private clientPath: string;

  constructor(options?: DomXrayRspackOptions) {
    this.options = options || {};
    this.clientPath = resolveClientPath();
  }

  apply(compiler: any) {
    const isDev =
      compiler.options.mode === "development" ||
      process.env.NODE_ENV === "development";
    if (!isDev) {
      throw new Error(
        "[dom-xray] Rspack plugin can only be used in development mode. Remove it from your production build configuration."
      );
    }

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
      __DOM_XRAY_CONFIG__: JSON.stringify({
        title: config.title,
        hotkey: config.hotkey,
        clickSelector: config.clickSelector,
        targetFilePatterns: config.targetFilePatterns,
        editor: config.editor || "vscode",
        agentConfig: config.agentConfig,
      }),
      __DOM_XRAY_API__: JSON.stringify("/__dom-xray"),
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

            // Strip query (e.g. App.vue?vue&type=template) so the path
            // matches the data-source injected at compile time.
            const cleanPath = (mod.resource as string).split("?")[0];

            // Only collect source files (JS/TS/Vue/Svelte), not CSS/assets
            if (!/\.(js|jsx|ts|tsx|vue|svelte)$/.test(cleanPath)) continue;
            try {
              const raw = fs.readFileSync(cleanPath, "utf-8");
              moduleSources.set(cleanPath, {
                code: raw,
                path: cleanPath,
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
        mountMiddlewares(middlewares, config, moduleSources);
        return originalSetupMiddlewares(middlewares, devServerCtx);
      };
      compiler.options.devServer = devServer;
    });
  }
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
  middlewares: any[],
  config: PluginConfig,
  moduleSources: Map<string, { code: string; path: string }>
) {
  // Rspack dev-server v2 uses middlewares array instead of express app
  middlewares.push({
    name: "dom-xray-sources",
    path: "/__dom-xray/api/sources",
    middleware: (_req: any, res: any, _next: any) => {
      const sources = Array.from(moduleSources.values()).map((m) => ({
        filePath: m.path,
        source: m.code,
      }));
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(sources));
    },
  });

  middlewares.push({
    name: "dom-xray-submit",
    path: "/__dom-xray/api/submit",
    middleware: jsonBodyMiddleware(async (req: any, res: any) => {
      const data = req.body;
      if (typeof config.onSubmit === "function") {
        try {
          await config.onSubmit(data);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true }));
          return;
        } catch (e) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: String(e) }));
          return;
        }
      }
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, data }));
    }),
  });

  const agentMiddleware = createAgentMiddleware(config);
  middlewares.push({
    name: "dom-xray-agent",
    path: "/__dom-xray/api/agent",
    middleware: (req: any, res: any) => {
      agentMiddleware(req, res);
    },
  });
}

function jsonBodyMiddleware(handler: (req: any, res: any) => void | Promise<void>) {
  return (req: any, res: any, next: any) => {
    if (req.method !== "POST") {
      next();
      return;
    }
    let body = "";
    req.on("data", (chunk: any) => (body += chunk));
    req.on("end", async () => {
      try {
        req.body = JSON.parse(body);
      } catch {
        // ignore parse error
      }
      await handler(req, res);
    });
  };
}

export default DomXrayRspackPlugin;
