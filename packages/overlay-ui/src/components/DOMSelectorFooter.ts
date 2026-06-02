import { cssTokens } from "./shared-styles.js";

export class DOMSelectorFooter extends HTMLElement {
  static tagName = "dom-selector-footer";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
  }

  setLoading(loading: boolean) {
    const confirmBtn = this.shadowRoot?.querySelector(".confirm-btn") as HTMLButtonElement | null;
    if (!confirmBtn) return;
    confirmBtn.disabled = loading;
    confirmBtn.textContent = loading ? "提交中..." : "确定";
  }

  private render() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>
        ${cssTokens}
        :host {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 12px 24px;
          border-top: 1px solid var(--ds-color-border);
          background: var(--ds-color-bg);
          flex-shrink: 0;
        }
        button {
          height: 32px;
          padding: 4px 15px;
          border-radius: var(--ds-radius-sm);
          font-size: 14px;
          cursor: pointer;
          font-family: var(--ds-font-sans);
          line-height: 22px;
          transition: all 0.2s;
          outline: none;
          border: 1px solid transparent;
        }
        .cancel-btn {
          background: var(--ds-color-bg);
          border-color: var(--ds-color-border-input);
          color: var(--ds-color-text);
        }
        .cancel-btn:hover {
          color: var(--ds-color-primary-hover);
          border-color: var(--ds-color-primary-hover);
        }
        .confirm-btn {
          background: var(--ds-color-primary);
          border-color: var(--ds-color-primary);
          color: #fff;
        }
        .confirm-btn:hover {
          background: var(--ds-color-primary-hover);
          border-color: var(--ds-color-primary-hover);
        }
        .confirm-btn:active {
          background: var(--ds-color-primary-active);
          border-color: var(--ds-color-primary-active);
        }
        .confirm-btn:disabled {
          background: rgba(0,0,0,0.04);
          color: var(--ds-color-text-disabled);
          border-color: var(--ds-color-border-input);
          cursor: not-allowed;
        }
      </style>
      <button class="cancel-btn">取消</button>
      <button class="confirm-btn">确定</button>
    `;

    this.shadowRoot.querySelector(".cancel-btn")?.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("dom-selector-close", { bubbles: true, composed: true }));
    });

    this.shadowRoot.querySelector(".confirm-btn")?.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("dom-selector-confirm", { bubbles: true, composed: true }));
    });
  }
}
