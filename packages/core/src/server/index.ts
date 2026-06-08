import { createServer } from "node:http";
import type { PluginConfig, SourceInfo, SubmitData } from "../types";

export function createOverlayServer(
  config: PluginConfig,
  getSources: () => SourceInfo[]
) {
  const server = createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    const url = new URL(req.url || "/", "http://localhost");

    if (url.pathname === "/__dom-xray/api/sources") {
      const sources = getSources();
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(sources));
      return;
    }

    if (url.pathname === "/__dom-xray/api/submit" && req.method === "POST") {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }
      const data = JSON.parse(body) as SubmitData;

      if (typeof config.onSubmit === "function") {
        try {
          await config.onSubmit(data);
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, error: String(e) }));
          return;
        }
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, data }));
      return;
    }

    res.statusCode = 404;
    res.end("Not Found");
  });

  return server;
}
