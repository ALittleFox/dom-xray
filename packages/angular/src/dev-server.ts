import http from "node:http";
import fs from "node:fs";
import path from "node:path";
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

function resolveClientPath(): string {
  // Try resolving from the current working directory (user's project)
  try {
    return require.resolve("@dom-selector/overlay-ui/dist/client.js", {
      paths: [process.cwd()],
    });
  } catch {
    // fallthrough
  }
  // Try resolving from this module's directory
  try {
    return require.resolve("@dom-selector/overlay-ui/dist/client.js");
  } catch {
    // fallthrough
  }
  // Fallback: assume monorepo structure
  return path.resolve(__dirname, "../../../packages/overlay-ui/dist/client.js");
}

export function startDevServer(port: number = 8090): void {
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

    if (req.url === "/__dom-selector/client.js" && req.method === "GET") {
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

    if (req.url === "/__dom-selector/api/sources" && req.method === "GET") {
      const sources = collectSources(process.cwd());
      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);
      res.end(JSON.stringify(sources));
      return;
    }

    if (req.url === "/__dom-selector/api/submit" && req.method === "POST") {
      jsonBody(req, res, () => {
        res.setHeader("Content-Type", "application/json");
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, data: (req as any).body }));
      });
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  server.listen(port, () => {
    console.log(
      `[dom-selector] API server running on http://localhost:${port}`
    );
  });
}
