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
const overlay = document.createElement(
  "dom-selector-overlay"
) as DOMSelectorOverlay;
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
let inspectToast: HTMLDivElement | null = null;

function getOS(): "mac" | "win" | "other" {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes("mac") || platform.includes("darwin")) return "mac";
  if (platform.includes("win")) return "win";
  return "other";
}

function getExpectedHotkey(): string[] {
  const os = getOS();
  const hotkey = config.hotkey || {};
  const raw =
    os === "mac"
      ? hotkey.mac || "command"
      : os === "win"
      ? hotkey.win || "ctrl"
      : hotkey.win || "ctrl";
  return raw.split(/\+|\s/).map((p) => p.trim().toLowerCase());
}

function getHotkeyLabel(): string {
  const os = getOS();
  const hotkey = config.hotkey || {};
  return os === "mac"
    ? hotkey.mac || "Cmd"
    : os === "win"
    ? hotkey.win || "Ctrl"
    : hotkey.win || "Ctrl";
}

function checkHotkeyHeld(e: KeyboardEvent | MouseEvent): boolean {
  const parts = getExpectedHotkey();
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
    } else {
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
  inspectToast.textContent = `按住 ${getHotkeyLabel()} 点击元素查看源码，按 Esc 取消`;
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
  document.body.style.cursor = "";
  hideInspectToast();
}

// Track modifier key press to enter inspect mode
window.addEventListener("keydown", (e) => {
  if (overlay.style.display === "flex") {
    // Dialog is open — hotkey toggles close
    if (checkHotkeyHeld(e)) {
      e.preventDefault();
      overlay.close();
    }
    return;
  }

  // Dialog closed — modifier keys enter inspect mode
  if (!isInspecting && checkHotkeyHeld(e)) {
    enterInspectMode();
  }
});

// Track modifier key release to exit inspect mode
window.addEventListener("keyup", () => {
  if (!isInspecting) return;
  // Use a tick to let the click handler fire first
  setTimeout(() => {
    if (!isInspecting) return;
    // Create a synthetic check — if modifiers are no longer held, exit
    const parts = getExpectedHotkey();
    const held =
      parts.some((p) =>
        ["command", "meta", "cmd"].includes(p)
      ) &&
      parts.some((p) =>
        ["ctrl", "control"].includes(p)
      );
    // Simple heuristic: if we expect single modifier, any keyup likely releases it
    if (parts.length === 1) {
      exitInspectMode();
    }
  }, 50);
});

// Escape cancels inspect mode
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isInspecting) {
    e.preventDefault();
    exitInspectMode();
  }
});

// Click while hotkey is held opens overlay
// Use mousedown for earlier capture so we can check modifiers before click fires
window.addEventListener(
  "mousedown",
  (e) => {
    if (!checkHotkeyHeld(e)) return;
    if (overlay.style.display === "flex") return;

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

// Prevent click events from bubbling when in inspect mode
document.addEventListener(
  "click",
  (e) => {
    if (checkHotkeyHeld(e)) {
      e.preventDefault();
      e.stopPropagation();
    }
  },
  true
);

// Expose for debugging
(window as any).__DOM_SELECTOR__ = {
  open: () => overlay.open(),
  close: () => overlay.close(),
};
