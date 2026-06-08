import { execSync } from "node:child_process";
import type { AgentConfig, SubmitData } from "../types";

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

    const modelId = agentConfig.options?.model || "composer-2.5";
    agent = await Agent.create({
      apiKey,
      model: { id: modelId },
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
