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
    const reactName = target.reactName;

    // Extract component-like names from className (PascalCase, kebab-case, etc.)
    const classTokens = target.className
      .split(/\s+/)
      .map((c) => c.trim())
      .filter(Boolean);

    const componentNames: string[] = [];
    const styleTokens: string[] = [];

    for (const token of classTokens) {
      // PascalCase likely component names
      if (/^[A-Z][a-zA-Z0-9_]+$/.test(token)) {
        componentNames.push(token);
      }
      // kebab-case that looks component-like (e.g. "register-form")
      else if (/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(token)) {
        const camel = token.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
        componentNames.push(camel);
        componentNames.push(
          camel.charAt(0).toUpperCase() + camel.slice(1)
        );
      }
      // shadcn / tailwind utility classes are ignored for matching
      else if (token.length > 2) {
        styleTokens.push(token);
      }
    }

    // Also check id
    if (target.id) {
      componentNames.push(target.id);
      if (/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(target.id)) {
        const camel = target.id.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
        componentNames.push(camel);
        componentNames.push(
          camel.charAt(0).toUpperCase() + camel.slice(1)
        );
      }
    }

    // Tag name as possible component (Button → button, BUTTON)
    const tagCandidates = [target.tagName, target.tagName.toLowerCase()];

    let bestIndex = 0;
    let bestScore = -1;

    sources.forEach((s, i) => {
      const lower = s.source.toLowerCase();
      let score = 0;

      // React component name from fiber tree gets the highest weight
      if (reactName) {
        const n = reactName.toLowerCase();
        if (n.length >= 2) {
          // export function/class/const ComponentName
          const exportPattern = new RegExp(
            `export\\s+(?:default\\s+)?(?:function|class|const)\\s+${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "gi"
          );
          const exportMatches = (s.source.match(exportPattern) || []).length;
          score += exportMatches * 30;

          // JSX usage
          const jsxPattern = new RegExp(
            `<(?:\\/)?${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "gi"
          );
          const jsxMatches = (s.source.match(jsxPattern) || []).length;
          score += jsxMatches * 15;

          // Plain occurrence
          const plainMatches = (lower.match(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
          score += plainMatches * 2;
        }
      }

      // Component names from className / id
      for (const name of componentNames) {
        const n = name.toLowerCase();
        if (n.length < 2) continue;

        // export function ComponentName / export class ComponentName / export default function ComponentName
        const exportPattern = new RegExp(
          `export\\s+(?:default\\s+)?(?:function|class|const)\\s+${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "gi"
        );
        const exportMatches = (s.source.match(exportPattern) || []).length;
        score += exportMatches * 10;

        // JSX usage: <ComponentName />, <ComponentName>, </ComponentName>
        const jsxPattern = new RegExp(
          `<(?:\\/)?${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "gi"
        );
        const jsxMatches = (s.source.match(jsxPattern) || []).length;
        score += jsxMatches * 5;

        // Plain occurrence
        const plainMatches = (lower.match(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
        score += plainMatches * 1;
      }

      // Tag name matches
      for (const tag of tagCandidates) {
        const t = tag.toLowerCase();
        const count = (lower.match(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
        score += count * 0.5;
      }

      // Text content fallback
      const textSnippet = target.textContent.slice(0, 30).toLowerCase();
      if (textSnippet.length > 2) {
        const textMatches = (lower.match(new RegExp(textSnippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
        score += textMatches * 2;
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
    codeEl.innerHTML = s ? this.highlightCode(s.source) : "// No source.";
    this.updateFileInfo(s || null);
  }

  private highlightCode(source: string): string {
    type Token = { type: "comment" | "string" | "text"; value: string };
    const tokens: Token[] = [];
    let i = 0;

    while (i < source.length) {
      const rest = source.slice(i);

      // Single-line comment
      if (rest.startsWith("//")) {
        const end = source.indexOf("\n", i);
        const val = end === -1 ? source.slice(i) : source.slice(i, end);
        tokens.push({ type: "comment", value: val });
        i += val.length;
        continue;
      }

      // Multi-line comment
      if (rest.startsWith("/*")) {
        const end = source.indexOf("*/", i + 2);
        const val = end === -1 ? source.slice(i) : source.slice(i, end + 2);
        tokens.push({ type: "comment", value: val });
        i += val.length;
        continue;
      }

      // Strings (single, double, template)
      if ('"\'`'.includes(source[i])) {
        const quote = source[i];
        let j = i + 1;
        while (j < source.length) {
          if (source[j] === "\\") {
            j += 2;
            continue;
          }
          if (source[j] === quote) {
            j++;
            break;
          }
          j++;
        }
        tokens.push({ type: "string", value: source.slice(i, j) });
        i = j;
        continue;
      }

      // Accumulate plain text until next special token
      let j = i + 1;
      while (j < source.length) {
        const c = source[j];
        const c2 = source.slice(j, j + 2);
        if (c2 === "//" || c2 === "/*" || '"\'`'.includes(c)) break;
        j++;
      }
      if (j > i) {
        tokens.push({ type: "text", value: source.slice(i, j) });
      }
      i = j;
    }

    return tokens
      .map((t) => {
        if (t.type === "comment") {
          return `<span class="token-comment">${this.escapeHtml(t.value)}</span>`;
        }
        if (t.type === "string") {
          return `<span class="token-string">${this.escapeHtml(t.value)}</span>`;
        }

        let html = this.escapeHtml(t.value);

        // JSX tags (after escapeHtml, < becomes &lt;)
        html = html.replace(
          /(&lt;\/?)([A-Z][a-zA-Z0-9]*|[a-z][a-z0-9]*)\b/g,
          '$1<span class="token-tag">$2</span>'
        );

        // Keywords
        const kw =
          /\b(abstract|as|asserts|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|from|function|get|if|implements|import|in|infer|instanceof|interface|is|keyof|let|module|namespace|new|null|of|package|private|protected|public|readonly|require|return|set|static|super|switch|symbol|this|throw|true|try|type|typeof|undefined|unique|unknown|var|void|while|with|yield)\b/g;
        html = html.replace(kw, '<span class="token-keyword">$1</span>');

        // Numbers
        html = html.replace(
          /\b(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g,
          '<span class="token-number">$1</span>'
        );

        return html;
      })
      .join("");
  }

  private updateFileInfo(source: SourceInfo | null) {
    const infoEl = this.shadowRoot?.querySelector(".file-info") as HTMLElement | null;
    if (!infoEl) return;
    if (!source) {
      infoEl.innerHTML = "";
      return;
    }
    const lines = source.source.split("\n").length;
    infoEl.innerHTML = `
      <span class="file-path">${this.escapeHtml(source.filePath)}</span>
      <span class="file-meta">${lines} 行</span>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
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
          overflow: hidden;
          background: var(--ds-color-bg);
        }
        .panel-header {
          padding: 14px 24px 10px;
          border-bottom: 1px solid var(--ds-color-border);
          background: var(--ds-color-bg);
        }
        .panel-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--ds-color-text-secondary);
          font-family: var(--ds-font-sans);
          line-height: 20px;
          margin-bottom: 8px;
        }
        .file-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .file-info .file-path {
          font-size: 12px;
          color: var(--ds-color-text-muted);
          font-family: var(--ds-font-mono);
          word-break: break-all;
          line-height: 18px;
        }
        .file-info .file-meta {
          flex-shrink: 0;
          font-size: 11px;
          color: var(--ds-color-text-disabled);
          font-family: var(--ds-font-sans);
          background: var(--ds-color-bg-secondary);
          padding: 1px 8px;
          border-radius: 10px;
          line-height: 16px;
        }
        .select-wrap {
          padding: 10px 24px;
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
        }
        pre {
          margin: 0;
          padding: 20px 24px;
          font-family: var(--ds-font-mono);
          font-size: 13px;
          line-height: 1.7;
          color: var(--ds-color-text);
          white-space: pre-wrap;
          word-break: break-word;
          tab-size: 2;
        }
        .token-comment {
          color: var(--ds-color-token-comment);
          font-style: italic;
        }
        .token-string {
          color: var(--ds-color-token-string);
        }
        .token-keyword {
          color: var(--ds-color-token-keyword);
          font-weight: 500;
        }
        .token-number {
          color: var(--ds-color-token-number);
        }
        .token-tag {
          color: var(--ds-color-token-tag);
        }
      </style>
      <div class="panel-header">
        <div class="panel-label">源码</div>
        <div class="file-info"></div>
      </div>
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
