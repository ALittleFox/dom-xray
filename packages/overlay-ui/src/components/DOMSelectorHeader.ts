import { cssTokens } from './shared-styles.js'

export class DOMSelectorHeader extends HTMLElement {
  static tagName = 'dom-selector-header'

  private _title = 'DOM Selector'

  get titleText() {
    return this._title
  }

  set titleText(value: string) {
    this._title = value
    const titleEl = this.shadowRoot?.querySelector(
      '.title-text',
    ) as HTMLElement | null
    if (titleEl) titleEl.textContent = value
  }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.render()
  }

  private render() {
    if (!this.shadowRoot) return
    this.shadowRoot.innerHTML = `
      <style>
        ${cssTokens}
        :host {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 24px;
          border-bottom: 1px solid var(--ds-color-border);
          background: var(--ds-color-bg);
          flex-shrink: 0;
        }
        .title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .title-icon {
          width: 4px;
          height: 18px;
          background: var(--ds-color-primary);
          border-radius: 2px;
        }
        .title-text {
          font-size: 16px;
          font-weight: 600;
          color: var(--ds-color-text);
          font-family: var(--ds-font-sans);
          line-height: 24px;
        }
        .close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: transparent;
          border: none;
          font-size: 16px;
          color: var(--ds-color-text-muted);
          cursor: pointer;
          border-radius: var(--ds-radius-sm);
          transition: all 0.2s;
          font-family: var(--ds-font-sans);
        }
        .close-btn:hover {
          color: var(--ds-color-danger);
          background: rgba(0,0,0,0.04);
        }
      </style>
      <div class="title-wrap">
        <div class="title-icon"></div>
        <div class="title-text">${this._title}</div>
      </div>
      <button class="close-btn" aria-label="Close">
        <svg viewBox="64 64 896 896" width="14" height="14" fill="currentColor"><path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9c-4.4 5.2-.7 13.1 6.1 13.1h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"/></svg>
      </button>
    `

    this.shadowRoot
      .querySelector('.close-btn')
      ?.addEventListener('click', () => {
        this.dispatchEvent(
          new CustomEvent('dom-selector-close', {
            bubbles: true,
            composed: true,
          }),
        )
      })
  }
}
