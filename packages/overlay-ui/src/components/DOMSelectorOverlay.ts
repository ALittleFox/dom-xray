import { cssTokens } from "./shared-styles.js";
import type { SourceInfo, DOMSelectorConfig, SubmitPayload, InspectTarget } from "../types.js";

export class DOMSelectorOverlay extends HTMLElement {
  static tagName = "dom-selector-overlay";

  config: DOMSelectorConfig = {};
  apiBase = "";

  private sources: SourceInfo[] = [];
  private inspectTarget?: InspectTarget;
  private abortController?: AbortController;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
    this.bindEvents();
  }

  private get header() {
    return this.querySelector("dom-selector-header") as HTMLElement & { titleText?: string } | null;
  }

  private get sourcePanel() {
    return this.querySelector("dom-selector-source-panel") as HTMLElement & {
      setSources?: (s: SourceInfo[], t?: InspectTarget) => void;
      selectedSource?: SourceInfo;
      config?: DOMSelectorConfig;
    } | null;
  }

  private get inputPanel() {
    return this.querySelector("dom-selector-input-panel") as HTMLElement & {
      value?: string;
    } | null;
  }

  private get footer() {
    return this.querySelector("dom-selector-footer") as HTMLElement & {
      setLoading?: (v: boolean) => void;
    } | null;
  }

  private get agentPanel() {
    return this.querySelector("dom-selector-agent-panel") as HTMLElement & {
      clear?: () => void;
      show?: () => void;
      hide?: () => void;
      appendText?: (text: string, type?: "assistant" | "thinking") => void;
      appendTool?: (name: string, status: string) => void;
      setStatus?: (status: string) => void;
      setDone?: () => void;
      setError?: (message: string) => void;
    } | null;
  }

  open(inspectTarget?: InspectTarget) {
    this.style.display = "flex";
    this.inspectTarget = inspectTarget;
    if (this.header) {
      (this.header as any).titleText = this.config.title || "DOM Selector";
    }
    if (this.sourcePanel) {
      this.sourcePanel.config = this.config;
    }
    this.agentPanel?.hide?.();
    this.agentPanel?.clear?.();
    this.loadSources();
  }

  close() {
    this.style.display = "none";
    this.inspectTarget = undefined;
    if (this.inputPanel) {
      (this.inputPanel as any).value = "";
    }
    if (this.footer) {
      (this.footer as any).setLoading?.(false);
    }
    this.agentPanel?.hide?.();
    this.agentPanel?.clear?.();
    this.abortController?.abort();
    this.abortController = undefined;
  }

  private async loadSources() {
    try {
      const res = await fetch(`${this.apiBase}/api/sources`);
      if (!res.ok) throw new Error("Failed to fetch sources");
      this.sources = (await res.json()) as SourceInfo[];
      this.sourcePanel?.setSources?.(this.sources, this.inspectTarget);
    } catch {
      this.sourcePanel?.setSources?.([], this.inspectTarget);
    }
  }

  private async submit() {
    const source = this.sourcePanel?.selectedSource;
    const input = this.inputPanel?.value ?? "";
    if (!source) return;

    this.footer?.setLoading?.(true);

    const payload: SubmitPayload = {
      filePath: source.filePath,
      source: source.source,
      input,
      timestamp: Date.now(),
    };

    // If an agent is configured, use SSE agent endpoint
    if (this.config.agentConfig) {
      await this.submitAgent(payload);
      return;
    }

    // Fallback to original submit endpoint
    try {
      const res = await fetch(`${this.apiBase}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      console.log("[dom-selector] submit result:", result);
      this.close();
    } catch (e) {
      console.error("[dom-selector] submit failed:", e);
      this.footer?.setLoading?.(false);
      alert("提交失败，请查看控制台详情。");
    }
  }

  private async submitAgent(payload: SubmitPayload) {
    this.agentPanel?.clear?.();
    this.agentPanel?.show?.();
    const agentType = this.config.agentConfig?.type || "cursor";
    this.agentPanel?.setStatus?.(`正在连接 ${agentType === "opencode" ? "OpenCode" : "Cursor"} Agent...`);

    this.abortController = new AbortController();
    let hasFinalized = false;

    try {
      const res = await fetch(`${this.apiBase}/api/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: this.abortController.signal,
      });

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          const jsonStr = trimmed.slice(6);
          if (jsonStr === "[DONE]") {
            if (!hasFinalized) {
              this.agentPanel?.setDone?.();
            }
            this.footer?.setLoading?.(false);
            return;
          }

          try {
            const event = JSON.parse(jsonStr);
            if (event?.type === "done" || event?.type === "error") {
              hasFinalized = true;
            }
            this.handleAgentEvent(event);
          } catch {
            // ignore malformed JSON
          }
        }
      }

      if (!hasFinalized) {
        this.agentPanel?.setDone?.();
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        this.agentPanel?.setError?.("已取消");
      } else {
        console.error("[dom-selector] agent failed:", e);
        this.agentPanel?.setError?.(e?.message || String(e));
      }
    } finally {
      this.footer?.setLoading?.(false);
      this.abortController = undefined;
    }
  }

  private handleAgentEvent(event: any) {
    if (!event || typeof event !== "object") return;

    switch (event.type) {
      case "assistant": {
        const content = event.message?.content || [];
        for (const block of content) {
          if (block.type === "text" && block.text) {
            this.agentPanel?.appendText?.(block.text, "assistant");
          }
        }
        break;
      }
      case "thinking": {
        if (event.text) {
          this.agentPanel?.appendText?.(event.text, "thinking");
        }
        break;
      }
      case "tool_call": {
        this.agentPanel?.appendTool?.(event.name || "unknown", event.status || "");
        break;
      }
      case "status": {
        if (event.status) {
          this.agentPanel?.setStatus?.(event.status);
        }
        break;
      }
      case "error": {
        this.agentPanel?.setError?.(event.message || "Unknown error");
        break;
      }
      case "done": {
        this.agentPanel?.setDone?.();
        break;
      }
    }
  }

  private bindEvents() {
    this.addEventListener("dom-selector-close", () => this.close());
    this.addEventListener("dom-selector-confirm", () => this.submit());

    this.shadowRoot?.querySelector(".backdrop")?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) this.close();
    });
  }

  private render() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>
        ${cssTokens}
        :host {
          position: fixed;
          inset: 0;
          z-index: 2147483646;
          display: none;
          align-items: center;
          justify-content: center;
          font-family: var(--ds-font-sans);
        }
        .backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .panel {
          background: var(--ds-color-bg);
          width: 920px;
          max-width: 90vw;
          height: 600px;
          max-height: 90vh;
          border-radius: var(--ds-radius);
          box-shadow: var(--ds-shadow-modal);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }
      </style>
      <div class="backdrop">
        <div class="panel">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
