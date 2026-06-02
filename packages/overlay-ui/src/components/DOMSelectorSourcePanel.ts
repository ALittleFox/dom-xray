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
        }
        .file-info {
          padding: 8px 14px;
          font-size: 12px;
          color: var(--ds-color-text-muted);
          background: #f3f4f6;
          border-bottom: 1px solid var(--ds-color-border);
          font-family: var(--ds-font-mono);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .select-wrap {
          padding: 10px 14px;
          border-bottom: 1px solid var(--ds-color-border);
        }
        select {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid var(--ds-color-input-border);
          border-radius: var(--ds-radius-sm);
          font-size: 13px;
          background: var(--ds-color-bg);
          font-family: var(--ds-font-sans);
        }
        pre {
          flex: 1;
          margin: 0;
          padding: 14px;
          overflow: auto;
          font-family: var(--ds-font-mono);
          font-size: 12px;
          line-height: 1.5;
          background: var(--ds-color-code-bg);
          color: var(--ds-color-text);
          white-space: pre-wrap;
          word-break: break-word;
        }
      </style>
      <div class="file-info"></div>
      <div class="select-wrap">
        <select></select>
      </div>
      <pre><code>// Loading...</code></pre>
    `;

    this.shadowRoot.querySelector("select")?.addEventListener("change", () => {
      this.updateCode();
      this.dispatchEvent(
        new CustomEvent("dom-selector-source-change", { bubbles: true, composed: true })
      );
    });
  }
}
