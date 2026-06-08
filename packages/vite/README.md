# @dom-xray/vite

> [中文版本](README.zh-CN.md)

DOM XRay Vite plugin adapter. Supports Vite 5/6/8 dev server. Injects `data-source` attributes at compile time for JSX/TSX, Vue SFC, and Svelte files for precise source code positioning.

## Installation

```bash
npm i -D @dom-xray/vite
```

**Vue or Svelte projects** need the corresponding compiler installed (dynamically loaded by core on demand):

```bash
# Vue3 SFC support
npm i -D @vue/compiler-sfc

# Svelte support
npm i -D svelte
```

## Usage

### vite.config.ts

```ts
import { defineConfig } from "vite";
import domXray from "@dom-xray/vite";

export default defineConfig({
  plugins: [
    domXray({
      editor: "cursor",
    }),
  ],
});
```

## Configuration

All options can be passed in `vite.config.ts`, or configured via `dom-xray.config.json` in the project root.

```ts
interface DomXrayViteOptions {
  title?: string;                // overlay title, default "DOM XRay"
  hotkey?: { mac?: string; win?: string }; // shortcut, default option / alt
  editor?: "vscode" | "cursor" | "zed" | "trae"; // default vscode
  clickSelector?: string | false; // click trigger selector, default "[data-dom-xray]"
  targetFilePatterns?: string[];  // glob patterns to limit displayed source files
  onSubmit?: "return" | string | ((data: SubmitPayload) => void | Promise<void>);
  agentConfig?: AgentConfig;     // AI Agent configuration
}
```

See full configuration in the root [README.md](https://github.com/ALittleFox/dom-xray#readme).

## Features

- **Dev-only**: Production builds (`NODE_ENV=production`) throw an error automatically to prevent accidental inclusion
- **Auto-inject client script**: Injects config and `client.js` into `<head>` via `transformIndexHtml`
- **Source collection**: Collects raw `.js/.jsx/.ts/.tsx/.vue/.svelte` sources via `load` / `transform` hooks
- **API routes**: Mounts `/__dom-xray/api/sources`, `/api/submit`, and `/api/agent` on the Vite dev server
