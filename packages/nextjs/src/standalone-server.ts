import http from "node:http";
import fs from "node:fs";
import type { PluginConfig } from "@dom-selector/core";
import { resolveClientPath, createAgentMiddleware } from "@dom-selector/core";
import { collectSources } from "./source-collector.js";

function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.listen(startPort, () => {
      const port = (server.address() as any).port;
      server.close(() => resolve(port));
    });
    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        findAvailablePort(startPort + 1).then(resolve, reject);
      } else {
        reject(err);
      }
    });
  });
}

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

export async function startStandaloneServer(
  config: PluginConfig
): Promise<{ port: number; stop: () => void }> {
  const port = await findAvailablePort(3456);
  const clientPath = resolveClientPath();
  const agentMiddleware = createAgentMiddleware(config);

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

    const url = req.url || "/";

    // Serve client bundle
    if (url === "/__dom-selector/client.js" && req.method === "GET") {
      try {
        const content = fs.readFileSync(clientPath, "utf-8");
        res.setHeader("Content-Type", "application/javascript");
        res.setHeader("Cache-Control", "no-cache");
        res.writeHead(200);
        res.end(content);
      } catch (e: any) {
        res.writeHead(500);
        res.end(`[dom-selector] Failed to load client: ${e.message}`);
      }
      return;
    }

    // List sources
    if (url === "/__dom-selector/api/sources" && req.method === "GET") {
      const sources = collectSources();
      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);
      res.end(JSON.stringify(sources));
      return;
    }

    // Submit
    if (url === "/__dom-selector/api/submit" && req.method === "POST") {
      jsonBody(req, res, () => {
        const body = (req as any).body;
        if (typeof config.onSubmit === "function") {
          Promise.resolve(config.onSubmit(body))
            .then(() => {
              res.setHeader("Content-Type", "application/json");
              res.writeHead(200);
              res.end(JSON.stringify({ ok: true }));
            })
            .catch((e) => {
              res.setHeader("Content-Type", "application/json");
              res.writeHead(500);
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            });
          return;
        }
        res.setHeader("Content-Type", "application/json");
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, data: body }));
      });
      return;
    }

    // Agent SSE
    if (url === "/__dom-selector/api/agent" && req.method === "POST") {
      agentMiddleware(req, res);
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  await new Promise<void>((resolve) => {
    server.listen(port, () => {
      console.log(
        `[dom-selector] API server running on http://localhost:${port}`
      );
      resolve();
    });
  });

  return {
    port,
    stop: () => {
      server.close();
    },
  };
}
