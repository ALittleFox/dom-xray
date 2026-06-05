import { DOMSelectorOverlay } from "./components/DOMSelectorOverlay.js";
import { DOMSelectorHeader } from "./components/DOMSelectorHeader.js";
import { DOMSelectorBody } from "./components/DOMSelectorBody.js";
import { DOMSelectorSourcePanel } from "./components/DOMSelectorSourcePanel.js";
import { DOMSelectorInputPanel } from "./components/DOMSelectorInputPanel.js";
import { DOMSelectorFooter } from "./components/DOMSelectorFooter.js";
import { DOMSelectorAgentPanel } from "./components/DOMSelectorAgentPanel.js";
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
customElements.define(DOMSelectorAgentPanel.tagName, DOMSelectorAgentPanel);

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
    <div style="display:flex;flex-direction:column;overflow:hidden;">
      <dom-selector-input-panel></dom-selector-input-panel>
      <dom-selector-agent-panel></dom-selector-agent-panel>
    </div>
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

const HTML_TAGS = new Set([
  "div", "span", "p", "button", "input", "form", "label", "img", "a",
  "h1", "h2", "h3", "h4", "h5", "h6", "section", "article", "header",
  "footer", "main", "aside", "nav", "ul", "ol", "li", "br", "hr",
  "table", "thead", "tbody", "tr", "td", "th", "strong", "em",
  "small", "sup", "sub", "code", "pre", "blockquote", "fieldset",
  "legend", "textarea", "select", "option", "optgroup", "canvas",
  "svg", "path", "circle", "rect", "line", "polygon", "polyline",
  "g", "defs", "clipPath", "mask", "filter", "foreignObject",
  "video", "audio", "source", "track", "embed", "object", "param",
  "iframe", "noscript", "template", "slot",
]);

/** Walk up the DOM tree to find the nearest element with a data-source attribute. */
function findNearestDataSource(el: HTMLElement): string | undefined {
  let curr: HTMLElement | null = el;
  while (curr) {
    if (curr.dataset.source) {
      return curr.dataset.source;
    }
    curr = curr.parentElement;
  }
  return undefined;
}

function getReactComponentChain(el: HTMLElement): string[] {
  const fiberKey = Object.keys(el).find((k) =>
    k.startsWith("__reactFiber$")
  );
  if (!fiberKey) return [];
  const chain: string[] = [];
  const seen = new Set<string>();
  let fiber = (el as any)[fiberKey];
  while (fiber) {
    const type = fiber.type;
    if (type && (typeof type === "function" || typeof type === "object")) {
      const name = type.displayName || type.name;
      if (
        name &&
        name.length >= 2 &&
        !HTML_TAGS.has(name) &&
        !seen.has(name)
      ) {
        chain.push(name);
        seen.add(name);
      }
    }
    fiber = fiber.return;
  }
  return chain;
}

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
      ? hotkey.mac || "option"
      : os === "win"
      ? hotkey.win || "alt"
      : hotkey.win || "alt";
  return raw.split(/\+|\s/).map((p) => p.trim().toLowerCase());
}

function getHotkeyLabel(): string {
  const os = getOS();
  const hotkey = config.hotkey || {};
  return os === "mac"
    ? hotkey.mac || "Option"
    : os === "win"
    ? hotkey.win || "Alt"
    : hotkey.win || "Alt";
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

/** Check if the "jump to editor" combo is held:
 *  macOS: Option + Command
 *  Windows/Linux: Ctrl + Alt
 */
function checkEditorJumpHeld(e: KeyboardEvent | MouseEvent): boolean {
  const os = getOS();
  if (os === "mac") {
    return e.metaKey && e.altKey;
  }
  return e.ctrlKey && e.altKey;
}

/** Open the given dataSource ("filePath:line") in the configured editor. */
function openEditor(dataSource: string) {
  const parts = dataSource.split(":");
  const filePath = parts[0];
  const line = parts[1] ? parseInt(parts[1], 10) : undefined;
  if (!filePath) return;

  const editor = (config.editor || "vscode").toLowerCase();
  const lineStr = line && !isNaN(line) ? `:${line}` : "";
  let url: string;
  switch (editor) {
    case "vscode":
      url = `vscode://file${filePath}${lineStr}`;
      break;
    case "zed":
      url = `zed://file${filePath}${lineStr}`;
      break;
    case "trae":
      url = `trae://file${filePath}${lineStr}`;
      break;
    case "cursor":
      url = `cursor://file${filePath}${lineStr}`;
      break;
    case "vscode":
    default:
      url = `vscode://file${filePath}${lineStr}`;
      break;
  }
  window.open(url, "_blank");
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

  // Skip inspect mode if editor-jump combo is held
  if (checkEditorJumpHeld(e)) return;

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
    // Editor-jump combo takes precedence
    if (checkEditorJumpHeld(e)) {
      if (overlay.style.display === "flex") return;

      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;
      const dataSource = findNearestDataSource(target);
      if (dataSource) {
        openEditor(dataSource);
        exitInspectMode();
        return;
      }

      // No dataSource found — fall back to opening the overlay
      const inspectTarget: InspectTarget = {
        tagName: target.tagName,
        id: target.id,
        className: target.className,
        textContent: target.textContent?.slice(0, 100) || "",
        reactChain: getReactComponentChain(target),
        dataSource: undefined,
      };

      exitInspectMode();
      overlay.open(inspectTarget);
      return;
    }

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
      reactChain: getReactComponentChain(target),
      dataSource: findNearestDataSource(target),
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
