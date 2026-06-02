import { cssTokens } from "./shared-styles.js";
import type { SourceInfo, InspectTarget } from "../types.js";

export class DOMSelectorSourcePanel extends HTMLElement {
  static tagName = "dom-selector-source-panel";

  private sources: SourceInfo[] = [];

  get selectedSource(): SourceInfo | undefined {
    const select = this.shadowRoot?.querySelector("select") as HTMLSelectElement | null;
    if (!select) return undefined;
    return this.sources[select.selectedIndex];
  }

  setSources(sources: SourceInfo[], inspectTarget?: InspectTarget) {
    this.sources = sources;
    const select = this.shadowRoot?.querySelector("select") as HTMLSelectElement | null;
    const codeEl = this.shadowRoot?.querySelector("code") as HTMLElement | null;
    if (!select || !codeEl) return;

    select.innerHTML = "";
    if (sources.length === 0) {
      codeEl.textContent = "// No source found.";
      this.updateFileInfo(null);
      const opt = document.createElement("option");
      opt.textContent = "No sources";
      select.appendChild(opt);
      return;
    }

    sources.forEach((s, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = s.filePath + (s.isEntry ? " (entry)" : "");
      select.appendChild(opt);
    });

    let selectedIndex = 0;
    if (inspectTarget && sources.length > 0) {
      selectedIndex = this.findBestMatch(inspectTarget, sources);
    }

    select.selectedIndex = selectedIndex;
    this.updateCode();
    this.updateFileInfo(sources[selectedIndex]);
  }

  private findBestMatch(target: InspectTarget, sources: SourceInfo[]): number {
    const classes = target.className
      .split(/\s+/)
      .map((c) => c.trim())
      .filter(Boolean);
    const keywords = [
      target.id,
      ...classes,
      target.tagName.toLowerCase(),
      target.textContent.slice(0, 50),
    ].filter(Boolean);

    let bestIndex = 0;
    let bestScore = -1;

    sources.forEach((s, i) => {
      const lower = s.source.toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        const k = kw.toLowerCase();
        if (k.length < 2) continue;
        const count = (lower.match(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
        score += count;
      }
      if (s.isEntry) score += 0.5;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    });

    return bestIndex;
  }

  private updateCode() {
    const select = this.shadowRoot?.querySelector("select") as HTMLSelectElement | null;
    const codeEl = this.shadowRoot?.querySelector("code") as HTMLElement | null;
    if (!select || !codeEl) return;
    const s = this.sources[select.selectedIndex];
    codeEl.textContent = s ? s.source : "// No source.";
    this.updateFileInfo(s || null);
  }

  private updateFileInfo(source: SourceInfo | null) {
    const infoEl = this.shadowRoot?.querySelector(".file-info") as HTMLElement | null;
    if (!infoEl) return;
    if (!source) {
      infoEl.textContent = "";
      return;
    }
    const lines = source.source.split("\n").length;
    infoEl.textContent = `${source.filePath} · ${lines} 行`;
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
  }

  private render() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>
        ${cssTokens}
        :host {
          flex: 1;
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--ds-color-border);
          overflow: hidden;
          background: var(--ds-color-bg);
        }
        .file-info {
          padding: 8px 16px;
          font-size: 12px;
          color: var(--ds-color-text-muted);
          background: var(--ds-color-bg-secondary);
          border-bottom: 1px solid var(--ds-color-border);
          font-family: var(--ds-font-mono);
          word-break: break-all;
        }
        .select-wrap {
          padding: 12px 16px;
          border-bottom: 1px solid var(--ds-color-border);
          background: var(--ds-color-bg);
        }
        select {
          width: 100%;
          padding: 5px 11px;
          border: 1px solid var(--ds-color-border-input);
          border-radius: var(--ds-radius-sm);
          font-size: 14px;
          line-height: 1.5;
          color: var(--ds-color-text);
          background: var(--ds-color-bg);
          font-family: var(--ds-font-sans);
          cursor: pointer;
          transition: border-color 0.2s;
          outline: none;
        }
        select:hover {
          border-color: var(--ds-color-primary-hover);
        }
        select:focus {
          border-color: var(--ds-color-primary);
          box-shadow: 0 0 0 2px rgba(5,145,255,0.1);
        }
        .code-wrap {
          flex: 1;
          overflow: auto;
          background: var(--ds-color-code-bg);
          border-bottom-left-radius: var(--ds-radius);
        }
        pre {
          margin: 0;
          padding: 16px;
          font-family: var(--ds-font-mono);
          font-size: 12px;
          line-height: 1.7;
          color: var(--ds-color-text);
          white-space: pre-wrap;
          word-break: break-word;
          tab-size: 2;
        }
      </style>
      <div class="file-info"></div>
      <div class="select-wrap">
        <select></select>
      </div>
      <div class="code-wrap">
        <pre><code>// Loading...</code></pre>
      </div>
    `;

    this.shadowRoot.querySelector("select")?.addEventListener("change", () => {
      this.updateCode();
      this.dispatchEvent(
        new CustomEvent("dom-selector-source-change", { bubbles: true, composed: true })
      );
    });
  }
}
