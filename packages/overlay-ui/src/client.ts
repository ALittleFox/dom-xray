import { DOMSelectorOverlay } from "./components/DOMSelectorOverlay.js";
import { DOMSelectorHeader } from "./components/DOMSelectorHeader.js";
import { DOMSelectorBody } from "./components/DOMSelectorBody.js";
import { DOMSelectorSourcePanel } from "./components/DOMSelectorSourcePanel.js";
import { DOMSelectorInputPanel } from "./components/DOMSelectorInputPanel.js";
import { DOMSelectorFooter } from "./components/DOMSelectorFooter.js";
import type { DOMSelectorConfig } from "./types.js";

/* global __DOM_SELECTOR_CONFIG__, __DOM_SELECTOR_API__ */
declare const __DOM_SELECTOR_CONFIG__: DOMSelectorConfig | undefined;
declare const __DOM_SELECTOR_API__: string | undefined;

const config: DOMSelectorConfig =
  typeof __DOM_SELECTOR_CONFIG__ !== "undefined"
    ? __DOM_SELECTOR_CONFIG__
    : {};

const apiBase: string =
  typeof __DOM_SELECTOR_API__ !== "undefined"
    ? __DOM_SELECTOR_API__
    : `${location.origin}/__dom-selector`;

// Register custom elements
customElements.define(DOMSelectorOverlay.tagName, DOMSelectorOverlay);
customElements.define(DOMSelectorHeader.tagName, DOMSelectorHeader);
customElements.define(DOMSelectorBody.tagName, DOMSelectorBody);
customElements.define(DOMSelectorSourcePanel.tagName, DOMSelectorSourcePanel);
customElements.define(DOMSelectorInputPanel.tagName, DOMSelectorInputPanel);
customElements.define(DOMSelectorFooter.tagName, DOMSelectorFooter);

// Create overlay instance
const overlay = document.createElement("dom-selector-overlay") as DOMSelectorOverlay;
overlay.config = config;
overlay.apiBase = apiBase;
overlay.innerHTML = `
  <dom-selector-header></dom-selector-header>
  <dom-selector-body>
    <dom-selector-source-panel></dom-selector-source-panel>
    <dom-selector-input-panel></dom-selector-input-panel>
  </dom-selector-body>
  <dom-selector-footer></dom-selector-footer>
`;

document.body.appendChild(overlay);

// Keyboard shortcut
function getOS(): "mac" | "win" | "other" {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes("mac") || platform.includes("darwin")) return "mac";
  if (platform.includes("win")) return "win";
  return "other";
}

function checkHotkey(e: KeyboardEvent): boolean {
  const os = getOS();
  const hotkey = config.hotkey || {};
  const expected =
    os === "mac"
      ? hotkey.mac || "command+option"
      : os === "win"
      ? hotkey.win || "ctrl+alt"
      : hotkey.win || "ctrl+alt";

  const parts = expected.split(/\+|\s/).map((p) => p.trim().toLowerCase());
  const keys: Record<string, boolean> = {
    meta: e.metaKey,
    command: e.metaKey,
    cmd: e.metaKey,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    shift: e.shiftKey,
  };

  for (const part of parts) {
    if (part === "command" || part === "meta" || part === "cmd") {
      if (!keys.meta) return false;
    } else if (part === "ctrl" || part === "control") {
      if (!keys.ctrl) return false;
    } else if (part === "alt" || part === "option") {
      if (!keys.alt) return false;
    } else if (part === "shift") {
      if (!keys.shift) return false;
    } else if (e.key.toLowerCase() !== part) {
      return false;
    }
  }
  return true;
}

window.addEventListener("keydown", (e) => {
  if (checkHotkey(e)) {
    e.preventDefault();
    const isOpen = overlay.style.display === "flex";
    if (isOpen) overlay.close();
    else overlay.open();
  }
});

// Click shortcut
const clickSelector =
  config.clickSelector !== false
    ? config.clickSelector || "[data-dom-selector]"
    : false;

if (clickSelector) {
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement;
      if (target.closest(clickSelector)) {
        e.preventDefault();
        e.stopPropagation();
        overlay.open();
      }
    },
    true
  );
}

// Expose for debugging
(window as any).__DOM_SELECTOR__ = { open: () => overlay.open(), close: () => overlay.close() };
