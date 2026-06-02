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
          padding: 14px 24px 20px;
          gap: 10px;
          overflow: auto;
          background: var(--ds-color-bg);
        }
        .input-panel{
            padding: 0 20px 0 10px;
            height: 100%;
            display: flex;
            justify-content: center;
            /* align-content: flex-start; */
            flex-direction: column;
        }
        .panel-header {
          font-size: 13px;
          font-weight: 500;
          color: var(--ds-color-text-secondary);
          font-family: var(--ds-font-sans);
          line-height: 20px;
        }
        textarea {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid var(--ds-color-border-input);
          border-radius: var(--ds-radius-sm);
          font-size: 14px;
          line-height: 1.6;
          color: var(--ds-color-text);
          resize: none;
          outline: none;
          font-family: var(--ds-font-sans);
          background: var(--ds-color-bg);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        textarea::placeholder {
          color: var(--ds-color-text-disabled);
        }
        textarea:hover {
          border-color: var(--ds-color-primary-hover);
        }
        textarea:focus {
          border-color: var(--ds-color-primary);
          box-shadow: 0 0 0 2px rgba(5,145,255,0.1);
        }
      </style>
      <div class="input-panel">
        <div class="panel-header">输入 / 备注</div>
        <textarea placeholder="在此输入提示词或备注..."></textarea>
      </div>
     
    `;
  }
}
