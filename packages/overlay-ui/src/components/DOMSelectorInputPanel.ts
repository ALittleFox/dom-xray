import { cssTokens } from "./shared-styles.js";

export class DOMSelectorInputPanel extends HTMLElement {
  static tagName = "dom-selector-input-panel";

  get value(): string {
    const textarea = this.shadowRoot?.querySelector("textarea") as HTMLTextAreaElement | null;
    return textarea?.value ?? "";
  }

  set value(v: string) {
    const textarea = this.shadowRoot?.querySelector("textarea") as HTMLTextAreaElement | null;
    if (textarea) textarea.value = v;
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
          padding: 16px;
          gap: 10px;
          overflow: auto;
        }
        label {
          font-size: 13px;
          font-weight: 500;
          color: var(--ds-color-text-secondary);
          font-family: var(--ds-font-sans);
        }
        textarea {
          flex: 1;
          padding: 12px;
          border: 1px solid var(--ds-color-input-border);
          border-radius: var(--ds-radius-md);
          font-size: 13px;
          line-height: 1.5;
          resize: none;
          outline: none;
          font-family: var(--ds-font-sans);
        }
        textarea:focus {
          border-color: var(--ds-color-input-focus);
        }
      </style>
      <label>输入 / 备注</label>
      <textarea placeholder="在此输入提示词或备注..."></textarea>
    `;
  }
}
