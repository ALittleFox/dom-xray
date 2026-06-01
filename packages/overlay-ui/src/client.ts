/* global __DOM_SELECTOR_CONFIG__, __DOM_SELECTOR_API__ */

declare const __DOM_SELECTOR_CONFIG__: any;
declare const __DOM_SELECTOR_API__: string;

interface SourceInfo {
  filePath: string;
  source: string;
  isEntry?: boolean;
}

interface DOMSelectorConfig {
  title?: string;
  hotkey?: { mac?: string; win?: string };
  clickSelector?: string | false;
  targetFilePatterns?: string[];
  onSubmit?: string;
}

const config: DOMSelectorConfig =
  typeof __DOM_SELECTOR_CONFIG__ !== "undefined"
    ? __DOM_SELECTOR_CONFIG__
    : {};

const apiBase: string =
  typeof __DOM_SELECTOR_API__ !== "undefined"
    ? __DOM_SELECTOR_API__
    : `${location.origin}/__dom-selector`;

let dialog: HTMLDivElement | null = null;

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
  const keys = {
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

async function fetchSources(): Promise<SourceInfo[]> {
  try {
    const res = await fetch(`${apiBase}/api/sources`);
    if (!res.ok) return [];
    return (await res.json()) as SourceInfo[];
  } catch {
    return [];
  }
}

async function submitData(data: {
  source: string;
  filePath: string;
  input: string;
}): Promise<any> {
  const res = await fetch(`${apiBase}/api/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      timestamp: Date.now(),
    }),
  });
  return res.json();
}

function createDialog() {
  if (dialog) return;

  // Overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 2147483646;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  `;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeDialog();
  });

  // Panel
  const panel = document.createElement("div");
  panel.style.cssText = `
    background: #fff;
    width: 900px;
    max-width: 90vw;
    height: 600px;
    max-height: 90vh;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;

  // Header
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid #e5e7eb;
  `;
  const title = document.createElement("div");
  title.textContent = config.title || "DOM Selector";
  title.style.cssText = `font-size: 16px; font-weight: 600; color: #111;`;

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.cssText = `
    background: transparent;
    border: none;
    font-size: 18px;
    color: #6b7280;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
  `;
  closeBtn.addEventListener("click", closeDialog);
  header.appendChild(title);
  header.appendChild(closeBtn);

  // Body
  const body = document.createElement("div");
  body.style.cssText = `
    display: flex;
    flex: 1;
    overflow: hidden;
  `;

  // Left: Source
  const left = document.createElement("div");
  left.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e5e7eb;
    overflow: hidden;
  `;
  const sourceSelectWrap = document.createElement("div");
  sourceSelectWrap.style.cssText = `padding: 10px 14px; border-bottom: 1px solid #e5e7eb;`;
  const sourceSelect = document.createElement("select");
  sourceSelect.style.cssText = `
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 13px;
    background: #fff;
  `;
  const sourceCode = document.createElement("pre");
  sourceCode.style.cssText = `
    flex: 1;
    margin: 0;
    padding: 14px;
    overflow: auto;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 12px;
    line-height: 1.5;
    background: #f9fafb;
    color: #111;
    white-space: pre-wrap;
    word-break: break-word;
  `;
  const codeText = document.createElement("code");
  sourceCode.appendChild(codeText);
  left.appendChild(sourceSelectWrap);
  sourceSelectWrap.appendChild(sourceSelect);
  left.appendChild(sourceCode);

  // Right: Input
  const right = document.createElement("div");
  right.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 10px;
    overflow: auto;
  `;
  const inputLabel = document.createElement("div");
  inputLabel.textContent = "Input / Notes";
  inputLabel.style.cssText = `font-size: 13px; font-weight: 500; color: #374151;`;
  const inputArea = document.createElement("textarea");
  inputArea.placeholder = "Type your notes or prompt here...";
  inputArea.style.cssText = `
    flex: 1;
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.5;
    resize: none;
    outline: none;
  `;
  inputArea.addEventListener("focus", () => {
    inputArea.style.borderColor = "#3b82f6";
  });
  inputArea.addEventListener("blur", () => {
    inputArea.style.borderColor = "#d1d5db";
  });
  right.appendChild(inputLabel);
  right.appendChild(inputArea);

  // Footer
  const footer = document.createElement("div");
  footer.style.cssText = `
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 20px;
    border-top: 1px solid #e5e7eb;
  `;
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.cssText = `
    padding: 8px 16px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    color: #374151;
    font-size: 13px;
    cursor: pointer;
  `;
  cancelBtn.addEventListener("click", closeDialog);
  const okBtn = document.createElement("button");
  okBtn.textContent = "Confirm";
  okBtn.style.cssText = `
    padding: 8px 16px;
    border: 1px solid #2563eb;
    border-radius: 6px;
    background: #2563eb;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
  `;
  okBtn.addEventListener("click", async () => {
    const idx = sourceSelect.selectedIndex;
    const source = sourcesCache[idx];
    if (!source) return;
    okBtn.textContent = "Submitting...";
    okBtn.disabled = true;
    try {
      const result = await submitData({
        filePath: source.filePath,
        source: source.source,
        input: inputArea.value,
      });
      console.log("[dom-selector] submit result:", result);
      closeDialog();
    } catch (e) {
      console.error("[dom-selector] submit failed:", e);
      okBtn.textContent = "Confirm";
      okBtn.disabled = false;
      alert("Submit failed, see console for details.");
    }
  });
  footer.appendChild(cancelBtn);
  footer.appendChild(okBtn);

  body.appendChild(left);
  body.appendChild(right);
  panel.appendChild(header);
  panel.appendChild(body);
  panel.appendChild(footer);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  dialog = overlay;

  // Load sources
  let sourcesCache: SourceInfo[] = [];
  fetchSources().then((sources) => {
    sourcesCache = sources;
    if (sources.length === 0) {
      codeText.textContent = "// No source found.";
      return;
    }
    sources.forEach((s, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = s.filePath + (s.isEntry ? " (entry)" : "");
      sourceSelect.appendChild(opt);
    });
    const updateCode = () => {
      const idx = sourceSelect.selectedIndex;
      const s = sourcesCache[idx];
      codeText.textContent = s ? s.source : "// No source.";
    };
    sourceSelect.addEventListener("change", updateCode);
    updateCode();
  });
}

function closeDialog() {
  if (dialog) {
    dialog.remove();
    dialog = null;
  }
}

// Keyboard shortcut
window.addEventListener("keydown", (e) => {
  if (checkHotkey(e)) {
    e.preventDefault();
    if (dialog) closeDialog();
    else createDialog();
  }
});

// Click shortcut
const clickSelector =
  config.clickSelector !== false
    ? config.clickSelector || "[data-dom-selector]"
    : false;

if (clickSelector) {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest(clickSelector)) {
      e.preventDefault();
      e.stopPropagation();
      createDialog();
    }
  }, true);
}

// Expose for debugging
(window as any).__DOM_SELECTOR__ = { open: createDialog, close: closeDialog };
