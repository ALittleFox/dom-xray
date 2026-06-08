import { cssTokens } from "./shared-styles.js";

export class DomXrayAgentPanel extends HTMLElement {
  static tagName = "dom-xray-agent-panel";

  private outputEl!: HTMLDivElement;
  private statusEl!: HTMLDivElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
  }

  clear() {
    this.outputEl.innerHTML = "";
    this.statusEl.textContent = "";
    this.statusEl.style.display = "none";
  }

  show() {
    this.style.display = "flex";
  }

  hide() {
    this.style.display = "none";
  }

  appendText(text: string, type: "assistant" | "thinking" = "assistant") {
    const line = document.createElement("div");
    line.className = `agent-line ${type}`;
    line.textContent = text;
    this.outputEl.appendChild(line);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  appendTool(name: string, status: string) {
    const line = document.createElement("div");
    line.className = "agent-line tool";
    line.textContent = `[tool] ${name}: ${status}`;
    this.outputEl.appendChild(line);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  setStatus(status: string) {
    this.statusEl.textContent = status;
    this.statusEl.style.display = "block";
  }

  setDone() {
    this.statusEl.textContent = "Agent 已完成";
    this.statusEl.style.display = "block";
    this.statusEl.classList.add("done");
  }

  setError(message: string) {
    this.statusEl.textContent = `错误: ${message}`;
    this.statusEl.style.display = "block";
    this.statusEl.classList.add("error");
  }

  private render() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>
        ${cssTokens}
        :host {
          display: none;
          flex-direction: column;
          flex: 1;
          padding: 14px 24px 20px;
          gap: 10px;
          overflow: hidden;
          background: var(--ds-color-bg);
          border-top: 1px solid var(--ds-color-border);
        }
        .panel-header {
          font-size: 13px;
          font-weight: 500;
          color: var(--ds-color-text-secondary);
          font-family: var(--ds-font-sans);
          line-height: 20px;
          flex-shrink: 0;
        }
        .output {
          flex: 1;
          overflow-y: auto;
          font-family: var(--ds-font-mono, monospace);
          font-size: 13px;
          line-height: 1.6;
          color: var(--ds-color-text);
          white-space: pre-wrap;
          word-break: break-word;
        }
        .agent-line {
          margin-bottom: 4px;
        }
        .agent-line.thinking {
          color: var(--ds-color-text-secondary);
          font-style: italic;
        }
        .agent-line.tool {
          color: var(--ds-color-primary);
          font-weight: 500;
        }
        .status {
          display: none;
          font-size: 12px;
          font-weight: 500;
          color: var(--ds-color-text-secondary);
          padding: 4px 8px;
          border-radius: var(--ds-radius-sm);
          background: var(--ds-color-bg-secondary);
          flex-shrink: 0;
        }
        .status.done {
          color: #52c41a;
          background: #f6ffed;
        }
        .status.error {
          color: #ff4d4f;
          background: #fff2f0;
        }
      </style>
      <div class="panel-header">Agent 输出</div>
      <div class="output"></div>
      <div class="status"></div>
    `;
    this.outputEl = this.shadowRoot.querySelector(".output") as HTMLDivElement;
    this.statusEl = this.shadowRoot.querySelector(".status") as HTMLDivElement;
  }
}
