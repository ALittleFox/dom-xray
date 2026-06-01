import { cssTokens } from "./shared-styles.js";
import type { SourceInfo, DOMSelectorConfig, SubmitPayload } from "../types.js";

export class DOMSelectorOverlay extends HTMLElement {
  static tagName = "dom-selector-overlay";

  config: DOMSelectorConfig = {};
  apiBase = "";

  private sources: SourceInfo[] = [];

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
      setSources?: (s: SourceInfo[]) => void;
      selectedSource?: SourceInfo;
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

  open() {
    this.style.display = "flex";
    if (this.header) {
      (this.header as any).titleText = this.config.title || "DOM Selector";
    }
    this.loadSources();
  }

  close() {
    this.style.display = "none";
    if (this.inputPanel) {
      (this.inputPanel as any).value = "";
    }
    if (this.footer) {
      (this.footer as any).setLoading?.(false);
    }
  }

  private async loadSources() {
    try {
      const res = await fetch(`${this.apiBase}/api/sources`);
      if (!res.ok) throw new Error("Failed to fetch sources");
      this.sources = (await res.json()) as SourceInfo[];
      this.sourcePanel?.setSources?.(this.sources);
    } catch {
      this.sourcePanel?.setSources?.([]);
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
          width: 900px;
          max-width: 90vw;
          height: 600px;
          max-height: 90vh;
          border-radius: var(--ds-radius);
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
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
