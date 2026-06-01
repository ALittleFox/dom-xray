import { cssTokens } from "./shared-styles.js";

export class DOMSelectorHeader extends HTMLElement {
  static tagName = "dom-selector-header";

  private _title = "DOM Selector";

  get titleText() {
    return this._title;
  }

  set titleText(value: string) {
    this._title = value;
    const titleEl = this.shadowRoot?.querySelector(".title") as HTMLElement | null;
    if (titleEl) titleEl.textContent = value;
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
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          border-bottom: 1px solid var(--ds-color-border);
        }
        .title {
          font-size: 16px;
          font-weight: 600;
          color: var(--ds-color-text);
          font-family: var(--ds-font-sans);
        }
        .close-btn {
          background: transparent;
          border: none;
          font-size: 18px;
          color: var(--ds-color-text-muted);
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
          font-family: var(--ds-font-sans);
        }
        .close-btn:hover {
          color: var(--ds-color-text);
        }
      </style>
      <div class="title">${this._title}</div>
      <button class="close-btn" aria-label="Close">&#10005;</button>
    `;

    this.shadowRoot.querySelector(".close-btn")?.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("dom-selector-close", { bubbles: true, composed: true }));
    });
  }
}
