import fs from "node:fs";

export interface ClientServerOptions {
  /** path to overlay-ui client.js bundle */
  clientPath: string;
  /** callback for collecting sources */
  getSources: () => { filePath: string; source: string }[];
}

/**
 * Mount DOM Selector API routes on an Express/connect app.
 */
export function mountMiddlewares(
  app: any,
  opts: ClientServerOptions
): void {
  // Serve client.js bundle
  app.get("/__dom-selector/client.js", (_req: any, res: any) => {
    try {
      const content = fs.readFileSync(opts.clientPath, "utf-8");
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Cache-Control", "no-cache");
      res.status(200).send(content);
    } catch (e: any) {
      res.status(500).send(`Failed to load client: ${e.message}`);
    }
  });

  // Serve source files
  app.get("/__dom-selector/api/sources", (_req: any, res: any) => {
    const sources = opts.getSources();
    res.json(sources);
  });

  // Handle submit
  app.post("/__dom-selector/api/submit", jsonBody(), (req: any, res: any) => {
    res.json({ ok: true, data: req.body });
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
