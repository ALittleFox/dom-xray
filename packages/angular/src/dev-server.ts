import http from "node:http";
import fs from "node:fs";
import { loadConfig, resolveClientPath } from "./config";
import type { PluginConfig } from "./config";
import { collectSources } from "./source-collector";

function jsonBody(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  next: () => void
): void {
  if (req.headers["content-type"] !== "application/json") {
    next();
    return;
  }
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      (req as any).body = JSON.parse(body);
    } catch {
      // ignore
    }
    next();
  });
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

export function startDevServer(port: number = 8090, config?: PluginConfig): void {
  const cfg = config || loadConfig(process.cwd());
  const clientPath = resolveClientPath();

  const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === "/__dom-xray/client.js" && req.method === "GET") {
      try {
        const content = fs.readFileSync(clientPath, "utf-8");
        res.setHeader("Content-Type", "application/javascript");
        res.setHeader("Cache-Control", "no-cache");
        res.writeHead(200);
        res.end(content);
      } catch (e: any) {
        res.writeHead(500);
        res.end(`Failed to load client: ${e.message}`);
      }
      return;
    }

    if (req.url === "/__dom-xray/api/sources" && req.method === "GET") {
      const sources = collectSources(process.cwd());
      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);
      res.end(JSON.stringify(sources));
      return;
    }

    if (req.url === "/__dom-xray/api/submit" && req.method === "POST") {
      jsonBody(req, res, async () => {
        const body = (req as any).body;
        if (typeof cfg.onSubmit === "function") {
          try {
            await cfg.onSubmit(body);
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify({ ok: true }));
          } catch (e: any) {
            res.setHeader("Content-Type", "application/json");
            res.writeHead(500);
            res.end(JSON.stringify({ ok: false, error: String(e) }));
          }
          return;
        }
        res.setHeader("Content-Type", "application/json");
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, data: body }));
      });
      return;
    }

    if (req.url === "/__dom-xray/api/agent" && req.method === "POST") {
      getAgentMiddleware(cfg).then((middleware) => middleware(req, res));
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  server.listen(port, () => {
    console.log(
      `[dom-xray] API server running on http://localhost:${port}`
    );
  });
}
