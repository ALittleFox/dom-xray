import { DOMSelectorOverlay } from "./components/DOMSelectorOverlay.js";
import { DOMSelectorHeader } from "./components/DOMSelectorHeader.js";
import { DOMSelectorBody } from "./components/DOMSelectorBody.js";
import { DOMSelectorSourcePanel } from "./components/DOMSelectorSourcePanel.js";
import { DOMSelectorInputPanel } from "./components/DOMSelectorInputPanel.js";
import { DOMSelectorFooter } from "./components/DOMSelectorFooter.js";
import type { DOMSelectorConfig, InspectTarget } from "./types.js";

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

function mountOverlay() {
  document.body.appendChild(overlay);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountOverlay);
} else {
  mountOverlay();
}

// Inspect mode state
let isInspecting = false;
let hotkeyPressed = false;
let inspectToast: HTMLDivElement | null = null;

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

function showInspectToast() {
  if (inspectToast) return;
  inspectToast = document.createElement("div");
  inspectToast.style.cssText = `
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: #111;
    color: #fff;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    pointer-events: none;
    white-space: nowrap;
  `;
  const os = getOS();
  const hotkey = config.hotkey || {};
  const label =
    os === "mac"
      ? hotkey.mac || "Cmd + Option"
      : hotkey.win || "Ctrl + Alt";
  inspectToast.textContent = `按住 ${label} 点击元素查看源码，按 Esc 取消`;
  document.body.appendChild(inspectToast);
}

function hideInspectToast() {
  if (inspectToast) {
    inspectToast.remove();
    inspectToast = null;
  }
}

function enterInspectMode() {
  isInspecting = true;
  document.body.style.cursor = "crosshair";
  showInspectToast();
}

function exitInspectMode() {
  isInspecting = false;
  hotkeyPressed = false;
  document.body.style.cursor = "";
  hideInspectToast();
}

// Track hotkey press / release
window.addEventListener("keydown", (e) => {
  if (overlay.style.display === "flex") {
    // Dialog is open — hotkey toggles close
    if (checkHotkey(e)) {
      e.preventDefault();
      overlay.close();
    }
    return;
  }

  // Dialog closed — hotkey enters inspect mode
  if (checkHotkey(e)) {
    e.preventDefault();
    if (!hotkeyPressed) {
      hotkeyPressed = true;
      enterInspectMode();
    }
  }
});

window.addEventListener("keyup", (e) => {
  if (!isInspecting) return;
  // When any modifier key is released, check if hotkey is still held
  const os = getOS();
  const hotkey = config.hotkey || {};
  const expected =
    os === "mac"
      ? hotkey.mac || "command+option"
      : hotkey.win || "ctrl+alt";
  const parts = expected.split(/\+|\s/).map((p) => p.trim().toLowerCase());

  // If the released key is part of the hotkey combo, check if combo is still held
  const releasedKey = e.key.toLowerCase();
  const isModifierReleased =
    (parts.includes("command") || parts.includes("meta") || parts.includes("cmd")) &&
    (releasedKey === "meta" || releasedKey === "command" || releasedKey === "os") ||
    (parts.includes("ctrl") || parts.includes("control")) && releasedKey === "control" ||
    (parts.includes("alt") || parts.includes("option")) && releasedKey === "alt" ||
    parts.includes("shift") && releasedKey === "shift";

  if (isModifierReleased) {
    exitInspectMode();
  }
});

// Escape cancels inspect mode
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isInspecting) {
    e.preventDefault();
    exitInspectMode();
  }
});

// Click while inspecting opens overlay
document.addEventListener(
  "click",
  (e) => {
    if (!isInspecting) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    const inspectTarget: InspectTarget = {
      tagName: target.tagName,
      id: target.id,
      className: target.className,
      textContent: target.textContent?.slice(0, 100) || "",
    };

    exitInspectMode();
    overlay.open(inspectTarget);
  },
  true
);

// Expose for debugging
(window as any).__DOM_SELECTOR__ = {
  open: () => overlay.open(),
  close: () => overlay.close(),
};
