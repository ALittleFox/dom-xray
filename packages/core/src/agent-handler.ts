import type { PluginConfig, SubmitData } from "./types";

/**
 * Create a middleware handler that invokes Cursor Agent via SSE.
 *
 * The client POSTs { filePath, source, input } and receives
 * server-sent events (SSE) with streaming agent output.
 */
export function createAgentMiddleware(
  config: PluginConfig
): (req: any, res: any) => Promise<void> {
  return async (req: any, res: any) => {
    const apiKey = config.key || process.env.CURSOR_API_KEY;
    if (!apiKey) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "Missing Cursor API key. Set 'key' in dom-selector.config.json or CURSOR_API_KEY env var.",
        })
      );
      return;
    }

    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }

    let data: SubmitData;
    try {
      data = JSON.parse(body);
    } catch {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(200);

    const sendEvent = (event: unknown) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    let agent: any = null;

    try {
      // Dynamic import to avoid bundler issues if the SDK is optional
      const { Agent } = await import("@cursor/sdk");

      agent = await Agent.create({
        apiKey,
        model: { id: "composer-2.5" },
        local: { cwd: process.cwd() },
      });

      // Include file path context in the prompt
      const prompt = `File: ${data.filePath}\n\n${data.input}`;

      const run = await agent.send(prompt);

      for await (const event of run.stream()) {
        sendEvent(event);
      }

      sendEvent({ type: "done" });
    } catch (err: any) {
      sendEvent({
        type: "error",
        message: err?.message || String(err),
      });
    } finally {
      if (agent?.close) {
        try {
          agent.close();
        } catch {
          // ignore cleanup errors
        }
      }
      res.end();
    }
  };
}
