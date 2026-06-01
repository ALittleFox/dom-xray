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
          gap: 10px;
          padding: 12px 20px;
          border-top: 1px solid var(--ds-color-border);
        }
        button {
          padding: 8px 16px;
          border-radius: var(--ds-radius-sm);
          font-size: 13px;
          cursor: pointer;
          font-family: var(--ds-font-sans);
        }
        .cancel-btn {
          border: 1px solid var(--ds-color-input-border);
          background: var(--ds-color-bg);
          color: var(--ds-color-text-secondary);
        }
        .cancel-btn:hover {
          background: #f3f4f6;
        }
        .confirm-btn {
          border: 1px solid var(--ds-color-primary);
          background: var(--ds-color-primary);
          color: var(--ds-color-primary-text);
        }
        .confirm-btn:hover {
          background: #1d4ed8;
        }
        .confirm-btn:disabled {
          opacity: 0.6;
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
