import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import type { PluginConfig } from "@dom-xray/core";
import { resolveClientPath, createAgentMiddleware } from "@dom-xray/core";

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

function getCachePath(): string {
  return path.join(process.cwd(), ".nuxt", "dom-xray-cache.json");
}

function readSourcesFromCache(): { filePath: string; source: string }[] {
  try {
    const cachePath = getCachePath();
    return JSON.parse(fs.readFileSync(cachePath, "utf-8"));
  } catch {
    return [];
  }
}

export async function startStandaloneServer(
  config: PluginConfig
): Promise<{ port: number; stop: () => void }> {
  const port = await findAvailablePort(3456);
  const clientPath = resolveClientPath();
  const agentMiddleware = createAgentMiddleware(config);

  const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = req.url || "/";

    if (url === "/__dom-xray/client.js" && req.method === "GET") {
      try {
        const content = fs.readFileSync(clientPath, "utf-8");
        res.setHeader("Content-Type", "application/javascript");
        res.setHeader("Cache-Control", "no-cache");
        res.writeHead(200);
        res.end(content);
      } catch (e: any) {
        res.writeHead(500);
        res.end(`[dom-xray] Failed to load client: ${e.message}`);
      }
      return;
    }

    if (url === "/__dom-xray/api/sources" && req.method === "GET") {
      const sources = readSourcesFromCache();
      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);
      res.end(JSON.stringify(sources));
      return;
    }

    if (url === "/__dom-xray/api/submit" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        let data: any;
        try {
          data = JSON.parse(body);
        } catch {
          res.setHeader("Content-Type", "application/json");
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Invalid JSON body" }));
          return;
        }
        if (typeof config.onSubmit === "function") {
          Promise.resolve(config.onSubmit(data))
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
        res.end(JSON.stringify({ ok: true, data }));
      });
      return;
    }

    if (url === "/__dom-xray/api/agent" && req.method === "POST") {
      agentMiddleware(req, res);
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  await new Promise<void>((resolve) => {
    server.listen(port, () => {
      console.log(
        `[dom-xray] API server running on http://localhost:${port}`
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
