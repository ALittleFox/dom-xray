import type { PluginConfig, SubmitData, AgentConfig } from "../types";
import { runCursorAgent } from "./cursor.js";
import { runOpenCodeAgent } from "./opencode.js";
import { runClaudeAgent } from "./claude.js";

/**
 * Create a middleware handler that invokes an AI Agent via SSE.
 *
 * The client POSTs { filePath, source, input } and receives
 * server-sent events (SSE) with streaming agent output.
 */
export function createAgentMiddleware(
  config: PluginConfig
): (req: any, res: any) => Promise<void> {
  return async (req: any, res: any) => {
    const agentConfig = resolveAgentConfig(config);
    if (!agentConfig) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "Missing agent configuration. Set 'agentConfig' in dom-xray.config.json.",
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

    try {
      switch (agentConfig.type) {
        case "cursor": {
          await runCursorAgent(agentConfig, data, sendEvent);
          break;
        }
        case "opencode": {
          await runOpenCodeAgent(agentConfig, data, sendEvent);
          break;
        }
        case "claude": {
          await runClaudeAgent(agentConfig, data, sendEvent);
          break;
        }
        default: {
          sendEvent({
            type: "error",
            message: `Unsupported agent type: ${agentConfig.type}`,
          });
        }
      }
    } catch (err: any) {
      sendEvent({
        type: "error",
        message: err?.message || String(err),
      });
    } finally {
      res.end();
    }
  };
}

export function resolveAgentConfig(config: PluginConfig): AgentConfig | null {
  return config.agentConfig ?? null;
}

export { runCursorAgent } from "./cursor.js";
export { runOpenCodeAgent } from "./opencode.js";
export { runClaudeAgent } from "./claude.js";
