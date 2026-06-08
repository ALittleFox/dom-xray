import { cssTokens } from "./shared-styles.js";

export class DomXrayBody extends HTMLElement {
  static tagName = "dom-xray-body";

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
          flex: 1;
          overflow: hidden;
        }
        ::slotted(*) {
          flex: 1;
          min-width: 0;
        }
        ::slotted(dom-xray-source-panel) {
          border-right: 1px solid var(--ds-color-border);
        }
      </style>
      <slot></slot>
    `;
  }
}
