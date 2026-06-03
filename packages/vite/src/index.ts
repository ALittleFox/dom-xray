import type { Plugin, ViteDevServer } from "vite";
import type { ServerResponse, IncomingMessage } from "node:http";
import fs from "node:fs";
import { loadConfig, resolveClientPath, injectDataSource } from "@dom-selector/core";
import type { PluginConfig } from "@dom-selector/core";

export interface DOMSelectorViteOptions extends PluginConfig {}

export default function domSelectorPlugin(
  options?: DOMSelectorViteOptions
): Plugin {
  const userOptions = options || {};
  const moduleSources = new Map<string, { code: string; path: string }>();
  let apiBase = "";

  return {
    name: "dom-selector",
    enforce: "pre",
    apply: "serve",

    transform(_code, id) {
      try {
        if (id.startsWith("\0")) return null;
        if (id.includes("node_modules")) return null;
        // Exclude the injected client bundle itself
        if (id.includes("overlay-ui") && id.includes("client.js")) return null;
        // Only collect source files (JS/TS/Vue/Svelte), not CSS/assets
        if (/\.(js|jsx|ts|tsx|vue|svelte)$/.test(id)) {
          try {
            const raw = fs.readFileSync(id, "utf-8");
            moduleSources.set(id, { code: raw, path: id });
          } catch {
            // ignore files that cannot be read from disk
          }
        }
        // Inject data-source into JSX elements for accurate source mapping
        if (/\.(jsx|tsx)$/.test(id) && !id.includes("node_modules")) {
          const res = injectDataSource(_code, id);
          console.log(`[dom-selector] transformed: ${id}`);
          return res.code;
        }
      } catch (err: any) {
        console.error(`[dom-selector] transform error for ${id}:`, err?.message || err);
      }
      return null;
    },

    configureServer(server: ViteDevServer) {
      const fileConfig = loadConfig(server.config.root);
      const cfg = { ...fileConfig, ...userOptions };

      // Determine API base
      const port = server.config.server?.port || 5173;
      const origin = server.config.server?.origin;
      apiBase = origin || `http://localhost:${port}`;

      // Serve client bundle at a stable URL
      server.middlewares.use("/@dom-selector/client.js", (req, res, next) => {
        if (req.method !== "GET") {
          next();
          return;
        }
        try {
          const clientPath = resolveClientPath();
          const content = fs.readFileSync(clientPath, "utf-8");
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/javascript");
          res.setHeader("Cache-Control", "no-cache");
          res.end(content);
        } catch (e) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "text/plain");
          res.end(`[dom-selector] Failed to load client: ${String(e)}`);
        }
      });

      // API: list sources
      server.middlewares.use("/__dom-selector/api/sources", (req, res, next) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.end();
          return;
        }
        const sources = Array.from(moduleSources.values())
          .filter((m) => !m.path.includes("node_modules"))
          .map((m) => ({
            filePath: m.path,
            source: m.code,
          }));
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(sources));
      });

      // API: submit
      server.middlewares.use("/__dom-selector/api/submit", (req, res, next) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        jsonBody(req, res, async (body) => {
          if (typeof cfg.onSubmit === "function") {
            try {
              await cfg.onSubmit(body);
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
            return;
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true, data: body }));
        });
      });
    },

    transformIndexHtml(html) {
      const fileConfig = loadConfig();
      const cfg: PluginConfig = { ...fileConfig, ...userOptions };
      const configScript = `<script>window.__DOM_SELECTOR_CONFIG__ = ${JSON.stringify(
        {
          title: cfg.title,
          hotkey: cfg.hotkey,
          clickSelector: cfg.clickSelector,
          targetFilePatterns: cfg.targetFilePatterns,
        }
      )}; window.__DOM_SELECTOR_API__ = ${JSON.stringify(
        `${apiBase}/__dom-selector`
      )};</script>`;
      return html.replace(
        "<head>",
        `<head>${configScript}<script src="/@dom-selector/client.js"></script>`
      );
    },
  };
}

function jsonBody(
  req: IncomingMessage,
  res: ServerResponse,
  cb: (body: any) => void
) {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    try {
      cb(JSON.parse(raw));
    } catch {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }));
    }
  });
}
