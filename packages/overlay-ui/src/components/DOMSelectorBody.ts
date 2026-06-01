import { cssTokens } from "./shared-styles.js";

export class DOMSelectorBody extends HTMLElement {
  static tagName = "dom-selector-body";

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
      </style>
      <slot></slot>
    `;
  }
}
