import fs from "node:fs";
import { loadConfig, resolveClientPath } from "./config";
import type { PluginConfig } from "./config";

export interface ClientServerOptions {
  /** path to overlay-ui client.js bundle */
  clientPath?: string;
  /** callback for collecting sources */
  getSources: () => { filePath: string; source: string }[];
  /** plugin config */
  config?: PluginConfig;
}

let agentMiddlewarePromise: Promise<any> | null = null;

function loadCoreModule(): Promise<any> {
  // Use Function to bypass TypeScript's CommonJS transpilation of dynamic import()
  // so Node.js can load the ESM-only @dom-xray/core package.
  return Function('return import("@dom-xray/core")')();
}

function getAgentMiddleware(cfg: PluginConfig): Promise<any> {
  if (!agentMiddlewarePromise) {
    agentMiddlewarePromise = loadCoreModule().then((m: any) =>
      m.createAgentMiddleware(cfg)
    );
  }
  return agentMiddlewarePromise;
}

/**
 * Mount DOM XRay API routes on an Express/connect app.
 */
export function mountMiddlewares(
  app: any,
  opts: ClientServerOptions
): void {
  const cfg = opts.config || loadConfig(process.cwd());
  const clientPath = opts.clientPath || resolveClientPath();

  // Serve client.js bundle
  app.get("/__dom-xray/client.js", (_req: any, res: any) => {
    try {
      const content = fs.readFileSync(clientPath, "utf-8");
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Cache-Control", "no-cache");
      res.status(200).send(content);
    } catch (e: any) {
      res.status(500).send(`Failed to load client: ${e.message}`);
    }
  });

  // Serve source files
  app.get("/__dom-xray/api/sources", (_req: any, res: any) => {
    const sources = opts.getSources();
    res.json(sources);
  });

  // Handle submit
  app.post("/__dom-xray/api/submit", jsonBody(), async (req: any, res: any) => {
    if (typeof cfg.onSubmit === "function") {
      try {
        await cfg.onSubmit(req.body);
        res.json({ ok: true });
      } catch (e: any) {
        res.status(500).json({ ok: false, error: String(e) });
      }
      return;
    }
    res.json({ ok: true, data: req.body });
  });

  // Handle agent (SSE)
  app.post("/__dom-xray/api/agent", (req: any, res: any) => {
    getAgentMiddleware(cfg).then((middleware) => middleware(req, res));
  });
}

function jsonBody() {
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
