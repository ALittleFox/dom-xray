import type { AgentConfig, SubmitData } from "../types";

export async function runOpenCodeAgent(
  agentConfig: AgentConfig,
  data: SubmitData,
  sendEvent: (event: unknown) => void
) {
  const baseUrl = agentConfig.options?.baseUrl || "http://localhost:4096";
  const providerID = agentConfig.options?.providerID || "deepseek";
  const modelID = agentConfig.options?.model || "deepseek-v4-pro";

  try {
    // Dynamic import to avoid bundler issues if the SDK is optional
    const { createOpencodeClient } = await import("@opencode-ai/sdk");
    const client = createOpencodeClient({ baseUrl });

    // Create a new session
    const sessionRes = (await client.session.create({
      body: { title: "DOM XRay" },
    })) as any;

    if (sessionRes.error || !sessionRes.data) {
      throw new Error(
        sessionRes.error && typeof sessionRes.error === "object"
          ? sessionRes.error.message || JSON.stringify(sessionRes.error)
          : "Failed to create OpenCode session"
      );
    }

    const session = sessionRes.data;

    // Include file path context in the prompt
    const prompt = `File: ${data.filePath}\n\n${data.input}`;

    // Subscribe to SSE events BEFORE sending prompt, so we don't miss any events
    const eventRes = await client.event.subscribe();

    // Send the prompt to the session (async, returns immediately)
    const promptRes = (await (client.session as any).promptAsync({
      path: { id: session.id },
      body: {
        model: { providerID, modelID },
        parts: [{ type: "text", text: prompt } as any],
      },
    })) as any;

    if (promptRes.error) {
      throw new Error(
        promptRes.error && typeof promptRes.error === "object"
          ? promptRes.error.message || JSON.stringify(promptRes.error)
          : "Failed to send prompt to OpenCode"
      );
    }

    let receivedAnyContent = false;

    for await (const rawEvent of eventRes.stream) {
      const event = rawEvent as any;

      // Only handle events belonging to our session
      const evtSessionID =
        event.properties?.sessionID ?? event.properties?.sessionId ?? event.properties?.part?.sessionID ?? event.properties?.part?.sessionId;
      if (evtSessionID && evtSessionID !== session.id) {
        continue;
      }

      switch (event.type) {
        // Legacy event format
        case "message.part.updated": {
          const part = event.properties?.part;
          if (part?.type === "text") {
            const delta = event.properties?.delta || part.text || "";
            if (delta) {
              receivedAnyContent = true;
              sendEvent({ type: "thinking", text: delta });
            }
          }
          break;
        }
        // Modern event format (v2)
        case "session.next.text.delta": {
          const delta = event.properties?.delta;
          if (delta) {
            receivedAnyContent = true;
            sendEvent({ type: "thinking", text: delta });
          }
          break;
        }
        case "session.next.text.ended": {
          const text = event.properties?.text;
          if (text) {
            receivedAnyContent = true;
            sendEvent({ type: "thinking", text: text });
          }
          break;
        }
        case "session.next.reasoning.delta": {
          const delta = event.properties?.delta;
          if (delta) {
            receivedAnyContent = true;
            sendEvent({ type: "thinking", text: delta });
          }
          break;
        }
        case "session.next.tool.success": {
          const output = event.properties?.output;
          if (output) {
            sendEvent({
              type: "tool_call",
              name: event.properties?.name || "tool",
              status: output,
            });
          }
          break;
        }
        case "message.updated": {
          const info = event.properties?.info;
          if (info?.role === "assistant" && info?.summary) {
            const body = info.summary.body;
            if (body) {
              receivedAnyContent = true;
              sendEvent({ type: "thinking", text: body });
            }
          }
          break;
        }
        case "session.status": {
          const status = event.properties?.status;
          if (status?.type === "idle") {
            sendEvent({ type: "done" });
            return;
          }
          break;
        }
        case "session.idle": {
          sendEvent({ type: "done" });
          return;
        }
        case "session.error": {
          const error = event.properties?.error;
          const message =
            error && typeof error === "object"
              ? error.message || JSON.stringify(error)
              : String(error);
          sendEvent({ type: "error", message });
          return;
        }
      }
    }

    if (!receivedAnyContent) {
      sendEvent({
        type: "error",
        message: "OpenCode did not return any content. Check your model configuration and OpenCode server status.",
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
