import { execSync } from "node:child_process";
import type { PluginConfig, SubmitData, AgentConfig } from "./types";

function findRipgrepPath(): string | undefined {
  // Allow user override via environment variable
  if (process.env.RIPGREP_PATH) {
    return process.env.RIPGREP_PATH;
  }
  try {
    const cmd = process.platform === "win32" ? "where rg" : "which rg";
    const path = execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim().split("\n")[0];
    if (path) return path;
  } catch {
    // ignore
  }
  return undefined;
}

let ripgrepConfigured = false;

async function configureRipgrepIfNeeded() {
  if (ripgrepConfigured) return;
  const rgPath = findRipgrepPath();
  if (!rgPath) return;
  try {
    // Must use dynamic import so we configure the same ESM module instance
    const sdk = await import("@cursor/sdk");
    // configureRipgrepPath is not in the public types but exists at runtime
    if (typeof (sdk as any).configureRipgrepPath === "function") {
      (sdk as any).configureRipgrepPath(rgPath);
      ripgrepConfigured = true;
    }
  } catch {
    // ignore if SDK doesn't support this
  }
}

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
          error: "Missing agent configuration. Set 'agentConfig' in dom-selector.config.json.",
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

export async function runCursorAgent(
  agentConfig: AgentConfig,
  data: SubmitData,
  sendEvent: (event: unknown) => void
) {
  const apiKey =
    agentConfig.options?.key || process.env.CURSOR_API_KEY;
  if (!apiKey) {
    sendEvent({
      type: "error",
      message:
        "Missing Cursor API key. Set 'key' in agentConfig.options or CURSOR_API_KEY env var.",
    });
    return;
  }

  let agent: any = null;

  try {
    // Configure ripgrep path to suppress SDK warnings
    configureRipgrepIfNeeded();

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
  }
}
