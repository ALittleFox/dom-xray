import { cssTokens } from "./shared-styles.js";
import type { SourceInfo, InspectTarget, DomXrayConfig } from "../types.js";

export class DomXraySourcePanel extends HTMLElement {
  static tagName = "dom-xray-source-panel";

  config?: DomXrayConfig;

  private sources: SourceInfo[] = [];
  private inspectTarget?: InspectTarget;

  get selectedSource(): SourceInfo | undefined {
    const select = this.shadowRoot?.querySelector("select") as HTMLSelectElement | null;
    if (!select) return undefined;
    return this.sources[select.selectedIndex];
  }

  setSources(sources: SourceInfo[], inspectTarget?: InspectTarget) {
    this.sources = sources;
    this.inspectTarget = inspectTarget;
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
    // If data-source attribute exists, it provides the exact file path.
    // Format: "filePath:startLine"
    if (target.dataSource) {
      const exactPath = target.dataSource.split(":")[0];
      const exactIndex = sources.findIndex((s) => s.filePath === exactPath);
      if (exactIndex !== -1) return exactIndex;
      // Fallback: partial match (basename or includes)
      const partialIndex = sources.findIndex(
        (s) =>
          s.filePath.endsWith(exactPath) || exactPath.endsWith(s.filePath)
      );
      if (partialIndex !== -1) return partialIndex;
    }

    const reactChain = target.reactChain || [];

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

      // React component chain from fiber tree.
      // reactChain is ordered [innermost, ..., outermost].
      // Outer components (closer to page) get higher weight.
      for (let depth = 0; depth < reactChain.length; depth++) {
        const name = reactChain[depth];
        const n = name.toLowerCase();
        if (n.length < 2) continue;

        // Base weight: innermost 15, each outer level adds 10
        // so outermost gets the highest score.
        const exportWeight = 15 + depth * 10;
        const jsxWeight = exportWeight * 0.5;
        const plainWeight = 2;

        // export function/class/const ComponentName
        const exportPattern = new RegExp(
          `export\\s+(?:default\\s+)?(?:function|class|const)\\s+${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "gi"
        );
        const exportMatches = (s.source.match(exportPattern) || []).length;
        score += exportMatches * exportWeight;

        // JSX usage
        const jsxPattern = new RegExp(
          `<(?:\\/)?${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "gi"
        );
        const jsxMatches = (s.source.match(jsxPattern) || []).length;
        score += jsxMatches * jsxWeight;

        // Plain occurrence
        const plainMatches = (lower.match(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
        score += plainMatches * plainWeight;
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
    type Token = {
      type: "comment" | "string" | "jsx" | "text";
      value: string;
    };
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
        const val =
          end === -1 ? source.slice(i) : source.slice(i, end + 2);
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

      // JSX tags: <Tag ...> or </Tag>
      if (source[i] === "<") {
        const jsxMatch = rest.match(/^<\/?[a-zA-Z][a-zA-Z0-9]*/);
        if (jsxMatch) {
          let j = jsxMatch[0].length;
          let inString = false;
          let stringChar = "";
          while (j < rest.length) {
            const c = rest[j];
            if (!inString) {
              if (c === '"' || c === "'" || c === "`") {
                inString = true;
                stringChar = c;
              } else if (c === ">") {
                j++;
                break;
              }
            } else {
              if (c === "\\") {
                j += 2;
                continue;
              }
              if (c === stringChar) {
                inString = false;
              }
            }
            j++;
          }
          tokens.push({ type: "jsx", value: rest.slice(0, j) });
          i += j;
          continue;
        }
      }

      // Accumulate plain text until next special token
      let j = i + 1;
      while (j < source.length) {
        const c = source[j];
        const c2 = source.slice(j, j + 2);
        if (c === "<" || c2 === "//" || c2 === "/*" || '"\'`'.includes(c))
          break;
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

        if (t.type === "jsx") {
          const m = t.value.match(/^(<\/?)([a-zA-Z][a-zA-Z0-9]*)/);
          if (m) {
            const prefix = m[1];
            const tagName = m[2];
            const suffix = t.value.slice(m[0].length);
            return `${this.escapeHtml(prefix)}<span class="token-tag">${tagName}</span>${this.escapeHtml(suffix)}`;
          }
          return this.escapeHtml(t.value);
        }

        // text token: escape then highlight keywords/numbers
        let html = this.escapeHtml(t.value);

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

    // Prefer the nearest data-source path (stripping trailing :line) over the matched source filePath
    const displayPath = this.inspectTarget?.dataSource
      ? this.inspectTarget.dataSource.replace(/:\d+$/, "")
      : source.filePath;

    const lines = source.source.split("\n").length;
    infoEl.innerHTML = `
      <span class="file-path">${this.escapeHtml(displayPath)}</span>
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
        .panel-label-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .panel-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--ds-color-text-secondary);
          font-family: var(--ds-font-sans);
          line-height: 20px;
        }
        .open-editor-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border: 1px solid var(--ds-color-primary);
          border-radius: var(--ds-radius-sm);
          background: transparent;
          color: var(--ds-color-primary);
          font-size: 12px;
          font-family: var(--ds-font-sans);
          line-height: 18px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .open-editor-btn:hover {
          background: var(--ds-color-primary);
          color: #fff;
        }
        .open-editor-btn svg {
          width: 12px;
          height: 12px;
          fill: currentColor;
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
        <div class="panel-label-wrap">
          <div class="panel-label">源码</div>
          <button class="open-editor-btn" title="在编辑器中打开">
            <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            打开
          </button>
        </div>
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
        new CustomEvent("dom-xray-source-change", { bubbles: true, composed: true })
      );
    });

    this.shadowRoot.querySelector(".open-editor-btn")?.addEventListener("click", () => {
      this.openInEditor();
    });
  }

  private openInEditor() {
    const editor = (this.config?.editor || "cursor").toLowerCase();
    let filePath: string | undefined;
    let line: number | undefined;

    // Prefer dataSource from inspect target (format: "filePath:line")
    if (this.inspectTarget?.dataSource) {
      const parts = this.inspectTarget.dataSource.split(":");
      filePath = parts[0];
      line = parts[1] ? parseInt(parts[1], 10) : undefined;
    }

    // Fallback to currently selected source
    if (!filePath) {
      const selected = this.selectedSource;
      if (selected) {
        filePath = selected.filePath;
      }
    }

    if (!filePath) return;

    const lineStr = line && !isNaN(line) ? `:${line}` : "";
    let url: string;
    switch (editor) {
      case "cursor":
        url = `cursor://file${filePath}${lineStr}`;
        break;
      case "zed":
        url = `zed://file${filePath}${lineStr}`;
        break;
      case "trae":
        url = `trae://file${filePath}${lineStr}`;
        break;
      case "vscode":
      default:
        url = `vscode://file${filePath}${lineStr}`;
        break;
    }

    window.open(url, "_blank");
  }
}
