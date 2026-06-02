import type { Plugin, ViteDevServer } from "vite";
import type { ServerResponse, IncomingMessage } from "node:http";
import fs from "node:fs";
import { loadConfig, resolveClientPath } from "@dom-selector/core";
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

    transform(code, id) {
      if (id.startsWith("\0")) return null;
      if (id.includes("node_modules")) return null;
      if (/\.(js|jsx|ts|tsx|vue|svelte)$/.test(id)) {
        moduleSources.set(id, { code, path: id });
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
