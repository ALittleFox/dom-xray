import type { Plugin, ViteDevServer } from "vite";
import type { ServerResponse, IncomingMessage } from "node:http";
import fs from "node:fs";
import { loadConfig, resolveClientPath, injectDataSource, createAgentMiddleware } from "@dom-xray/core";
import type { PluginConfig } from "@dom-xray/core";

export interface DomXrayViteOptions extends PluginConfig {}

export default function domSelectorPlugin(
  options?: DomXrayViteOptions
): Plugin {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[dom-xray] Vite plugin can only be used in development mode. Remove it from your production build configuration."
    );
  }

  const userOptions = options || {};
  const moduleSources = new Map<string, { code: string; path: string }>();
  let apiBase = "";

  return {
    name: "dom-xray",
    enforce: "pre",
    apply: "serve",

    async load(id) {
      // Intercept .vue / .svelte files *before* framework compilers run,
      // injecting data-source into the raw source so the compiler preserves it.
      if (!id || id.startsWith("\0")) return null;
      if (id.includes("node_modules")) return null;
      if (!/\.(vue|svelte)$/.test(id)) return null;
      try {
        const raw = fs.readFileSync(id, "utf-8");
        moduleSources.set(id, { code: raw, path: id });
        const res = await injectDataSource(raw, id);
        if (res.code !== raw) {
          console.log(`[dom-xray] loaded: ${id}`);
          return res.code;
        }
      } catch (err: any) {
        console.error(`[dom-xray] load error for ${id}:`, err?.message || err);
      }
      return null;
    },

    async transform(_code, id) {
      try {
        if (id.startsWith("\0")) return null;
        if (id.includes("node_modules")) return null;
        // Exclude the injected client bundle itself
        if (id.includes("overlay-ui") && id.includes("client.js")) return null;
        // Collect raw source for the overlay (read from disk to get original code)
        if (/\.(js|jsx|ts|tsx|vue|svelte)$/.test(id)) {
          try {
            const raw = fs.readFileSync(id, "utf-8");
            moduleSources.set(id, { code: raw, path: id });
          } catch {
            // ignore files that cannot be read from disk
          }
        }
        // Inject data-source for JSX/TSX files (Vue/Svelte already handled in load)
        if (/\.(jsx|tsx)$/.test(id) && !id.includes("node_modules")) {
          const res = await injectDataSource(_code, id);
          console.log(`[dom-xray] transformed: ${id}`);
          return res.code;
        }
      } catch (err: any) {
        console.error(`[dom-xray] transform error for ${id}:`, err?.message || err);
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
      server.middlewares.use("/@dom-xray/client.js", (req, res, next) => {
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
          res.end(`[dom-xray] Failed to load client: ${String(e)}`);
        }
      });

      // API: list sources
      server.middlewares.use("/__dom-xray/api/sources", (req, res, _next) => {
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
      server.middlewares.use("/__dom-xray/api/submit", (req, res, _next) => {
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

      // API: agent (SSE)
      const agentMiddleware = createAgentMiddleware(cfg);
      server.middlewares.use("/__dom-xray/api/agent", (req, res, _next) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        agentMiddleware(req, res);
      });
    },

    transformIndexHtml(html) {
      const fileConfig = loadConfig();
      const cfg: PluginConfig = { ...fileConfig, ...userOptions };
      const configScript = `<script>window.__DOM_XRAY_CONFIG__ = ${JSON.stringify(
        {
          title: cfg.title,
          hotkey: cfg.hotkey,
          clickSelector: cfg.clickSelector,
          targetFilePatterns: cfg.targetFilePatterns,
          editor: cfg.editor || "vscode",
          agentConfig: cfg.agentConfig,
        }
      )}; window.__DOM_XRAY_API__ = ${JSON.stringify(
        `${apiBase}/__dom-xray`
      )};</script>`;
      return html.replace(
        "<head>",
        `<head>${configScript}<script src="/@dom-xray/client.js"></script>`
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
