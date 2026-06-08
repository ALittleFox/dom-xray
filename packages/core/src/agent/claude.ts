import type { AgentConfig, SubmitData } from "../types";

export async function runClaudeAgent(
  agentConfig: AgentConfig,
  data: SubmitData,
  sendEvent: (event: unknown) => void
) {
  try {
    // Dynamic import to avoid bundler issues if the SDK is optional
    const { query } = await import("@anthropic-ai/claude-agent-sdk");

    const prompt = `File: ${data.filePath}\n\n${data.input}`;

    const q = query({
      prompt,
      options: {
        cwd: process.cwd(),
        // Allow user to override model via config; otherwise use local Claude Code setting
        ...(agentConfig.options?.model ? { model: agentConfig.options.model } : {}),
        // Support permission mode: default | acceptEdits | bypassPermissions | plan | auto
        ...(agentConfig.options?.permissionMode
          ? { permissionMode: agentConfig.options.permissionMode }
          : {}),
        // Enable partial message streaming for real-time UI updates
        includePartialMessages: true,
      },
    });

    let receivedAnyContent = false;

    for await (const message of q) {
      switch (message.type) {
        case "stream_event": {
          // Partial assistant message (streaming delta)
          const partial = (message as any).partialMessage;
          const text = extractTextFromClaudeMessage(partial);
          if (text) {
            receivedAnyContent = true;
            sendEvent({ type: "thinking", text });
          }
          break;
        }
        case "assistant": {
          const text = extractTextFromClaudeMessage((message as any).message);
          if (text) {
            receivedAnyContent = true;
            sendEvent({ type: "thinking", text });
          }
          break;
        }
        case "result": {
          sendEvent({ type: "done" });
          return;
        }
        case "system": {
          const subtype = (message as any).subtype;
          if (subtype === "error") {
            sendEvent({
              type: "error",
              message: String((message as any).message ?? "Claude Code error"),
            });
            return;
          }
          break;
        }
      }
    }

    if (!receivedAnyContent) {
      sendEvent({
        type: "error",
        message: "Claude Code did not return any content.",
      });
    } else {
      sendEvent({ type: "done" });
    }
  } catch (err: any) {
    sendEvent({
      type: "error",
      message: err?.message || String(err),
    });
  }
}

function extractTextFromClaudeMessage(msg: any): string | undefined {
  if (!msg) return undefined;
  // Claude API message format: content is an array of content blocks
  const content = msg.content;
  if (Array.isArray(content)) {
    const texts: string[] = [];
    for (const block of content) {
      if (block?.type === "text" && block.text) {
        texts.push(block.text);
      }
    }
    return texts.join("");
  }
  // Fallback for plain string content
  if (typeof content === "string") {
    return content;
  }
  return undefined;
}
