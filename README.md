# DOM XRay (Source Code Locator / LLM Dev Tool)

> [中文版本](README.zh-CN.md)

A framework-agnostic **development-mode** plugin supporting **Vite**, **Webpack**, **Rspack**, **Next.js**, **Nuxt 3**, and **Angular**. Quickly open a source-code overlay via hotkey + mouse click to precisely locate component source positions, with support for sending to LLMs or opening directly in your editor.

## Features

- **One-click invocation**: macOS `Option + Click` / Windows & Linux `Alt + Click` (customizable key combinations supported)
- **Compile-time precise positioning**: Injects `data-source` attributes during compilation for JSX/TSX, Vue SFC `<template>`, Svelte, and Angular HTML templates, mapping clicked elements directly to source files and line numbers
- **Bubble-up lookup**: When clicking child elements, automatically traverses up the DOM to find the nearest `data-source`, ensuring you always land on the most relevant component
- **Source code syntax highlighting**: The left panel in the overlay supports JSX / TSX syntax highlighting
- **Open in editor**: Built-in "Open" button in the source panel supports one-click jump to VSCode / Cursor / Zed / Trae
- **Multi-framework support**: React / SolidJS / Vue3 (JSX & SFC `<template>`) / Svelte / Angular
- **Multi-bundler support**: `Vite 5/6/8`, `Webpack 5`, `Rspack 2+`, `Next.js`, `Nuxt 3`, `Angular v17+`
- **Web Components overlay**: Built with Shadow DOM for complete style isolation, no pollution of the host page

## Installation

Choose the plugin package for your bundler:

```bash
# Vite
npm i -D @dom-xray/vite

# Webpack
npm i -D @dom-xray/webpack

# Rspack
npm i -D @dom-xray/rspack

# Next.js
npm i -D @dom-xray/nextjs

# Nuxt 3
npm i -D @dom-xray/nuxt

# Angular (v17+)
npm i -D @dom-xray/angular
```

**Vue or Svelte projects** need the corresponding compiler installed (dynamically loaded by core on demand):

```bash
# Vue3 SFC support
npm i -D @vue/compiler-sfc

# Svelte support
npm i -D svelte
```

### Vite (vite.config.ts)

```ts
import { defineConfig } from "vite";
import domXray from "@dom-xray/vite";

export default defineConfig({
  plugins: [
    domXray({
      // Optional: custom editor, defaults to vscode
      editor: "cursor",
    }),
  ],
});
```

### Webpack (webpack.config.js)

```js
import { DomXrayPlugin } from "@dom-xray/webpack";

export default {
  plugins: [
    new DomXrayPlugin({
      editor: "vscode",
    }),
  ],
};
```

### Rspack (rspack.config.js)

```js
import { DomXrayRspackPlugin } from "@dom-xray/rspack";

export default {
  plugins: [
    new DomXrayRspackPlugin({
      editor: "zed",
    }),
  ],
};
```

### Next.js (next.config.js)

```js
const { withDomSelector } = require("@dom-xray/nextjs");

module.exports = withDomSelector(
  { reactStrictMode: true },
  { title: "My App", editor: "vscode" }
);
```

Supports both Turbopack and webpack modes. In Turbopack mode, injects webpack-loader-compatible rules via `turbopack.rules`; in webpack mode, registers a pre-loader directly.

### Nuxt 3 (nuxt.config.ts)

```ts
export default defineNuxtConfig({
  modules: [
    [
      "@dom-xray/nuxt",
      {
        editor: "vscode",
      },
    ],
  ],
});
```

The Nuxt module injects `data-source` into template elements at compile time via Vue compiler `nodeTransforms`, and also provides Nitro API routes and a client plugin.

### Angular (v17+)

After installation, use the `dom-xray-ng` command instead of `ng`:

```bash
npm i -D @dom-xray/angular
```

**1. Update `package.json` scripts:**

```json
{
  "scripts": {
    "start": "dom-xray-ng serve --port 8089",
    "build": "ng build"
  }
}
```

`dom-xray-ng` automatically handles:
- Intercepting Angular compiler's HTML template reads and injecting `data-source`
- Intercepting inline templates in `.ts` files (`template: \`...\``) and injecting `data-source`
- Starting an API server (port 8090) supporting source queries, submissions, and AI Agent SSE streaming
- **Automatically injecting the client script and config into `index.html`** (dev mode only, via proxy interception)
- Passing all arguments through to the Angular CLI
- Supporting full `dom-xray.config.json` configuration (including `agentConfig`)

> **Why don't you need to modify `angular.json` or `src/index.html`?**
> `dom-xray-ng serve` starts a lightweight proxy:
> - Automatically injects `<script src="/__dom-xray/client.js">` when serving `index.html`
> - Proxies `/__dom-xray/*` requests to the API server
> - Forwards all other requests and HMR WebSockets directly to the Angular dev server
>
> Production builds (`ng build`) bypass this proxy, so production artifacts remain completely clean.

## Configuration

Create `dom-xray.config.json` in your project root (or add a `domXray` field in `package.json`):

```json
{
  "title": "DOM XRay",
  "hotkey": {
    "mac": "option",
    "win": "alt"
  },
  "editor": "cursor",
  "enabled": true,
  "onSubmit": "return",
  "agentConfig": {
    "type": "cursor",
    "options": {
      "key": "your_cursor_api_key"
    }
  }
}
```

### Options

| Option | Default | Description |
| --- | --- | --- |
| `title` | `"DOM XRay"` | Overlay title |
| `hotkey.mac` | `"option"` | macOS shortcut |
| `hotkey.win` | `"alt"` | Windows / Linux shortcut |
| `editor` | `"cursor"` | Editor for the "Open" button. Options: `vscode`, `cursor`, `zed`, `trae` |
| `enabled` | `true` | Enable hotkey + click to invoke the overlay. Set to `false` to disable |
| `clickSelector` | `"[data-dom-xray]"` | CSS selector for click triggers. Set to `false` to disable |
| `targetFilePatterns` | — | Optional glob pattern array to limit which source files are shown |
| `onSubmit` | `"return"` | Options: `"return"` (return via API), URL string, or function `(data) => void \| Promise<void>` |
| `agentConfig` | — | AI Agent config for interacting with LLMs directly in the overlay. See examples below |

### Supported Key Combinations

`hotkey` supports single keys or combinations, connected with `+` or space.

**Supported key names:**

| Key | Aliases |
| --- | --- |
| `command` (⌘) | `command`, `cmd`, `meta` |
| `ctrl` (Ctrl) | `ctrl`, `control` |
| `alt` (⌥) | `alt`, `option` |
| `shift` (⇧) | `shift` |

**Common combination examples:**

```json
{
  "hotkey": {
    "mac": "option",
    "win": "alt"
  }
}
```

```json
{
  "hotkey": {
    "mac": "command+option",
    "win": "ctrl+shift"
  }
}
```

```json
{
  "hotkey": {
    "mac": "command+shift",
    "win": "ctrl+alt"
  }
}
```

### Agent Configuration

`agentConfig` is used to interact directly with AI Agents (Cursor, OpenCode, Claude) in the overlay. Submit source code and questions to receive real-time streaming responses.

#### Cursor

```json
{
  "agentConfig": {
    "type": "cursor",
    "options": {
      "key": "your_cursor_api_key",
      "model": "composer-2.5"
    }
  }
}
```

| Option | Default | Description |
| --- | --- | --- |
| `type` | — | `"cursor"` |
| `options.key` | — | Cursor API Key. Can also be set via `CURSOR_API_KEY` env variable |
| `options.model` | `"composer-2.5"` | Model ID to use |

#### OpenCode

```json
{
  "agentConfig": {
    "type": "opencode",
    "options": {
      "baseUrl": "http://localhost:4096",
      "providerID": "deepseek",
      "model": "deepseek-v4-pro"
    }
  }
}
```

| Option | Default | Description |
| --- | --- | --- |
| `type` | — | `"opencode"` |
| `options.baseUrl` | `"http://localhost:4096"` | OpenCode local server address |
| `options.providerID` | `"deepseek"` | Model provider ID |
| `options.model` | `"deepseek-v4-pro"` | Model ID |

> **Note**: Before using OpenCode, start the OpenCode Web service:
> ```bash
> opencode web
> ```
> Ensure the service is listening on the configured `baseUrl` (default `http://localhost:4096`).
>
> OpenCode uses the local server's own auth configuration; no additional API Key is needed in the plugin.

#### Claude

```json
{
  "agentConfig": {
    "type": "claude",
    "options": {
      "model": "claude-sonnet-4",
      "permissionMode": "acceptEdits"
    }
  }
}
```

| Option | Default | Description |
| --- | --- | --- |
| `type` | — | `"claude"` |
| `options.model` | — | Optional, overrides the local Claude Code default model. Leave empty to use local Claude Code config |
| `options.permissionMode` | `"acceptEdits"` | Permission mode: `acceptEdits` (auto-accept file edits, default), `default` (requires auth), `auto` (model auto-approves), `plan` (planning only), `bypassPermissions` (bypass all permissions, use with caution) |

> **Note**: Before using Claude Agent, ensure Claude Code is installed and configured locally.
> Claude Code uses its own local auth and model configuration; no API Key is needed in the plugin.
> If you've changed Claude Code's model to a third-party model like DeepSeek, the SDK will automatically use that configuration.
>
> To have the Agent modify code directly without authorization prompts, set `permissionMode` to `"acceptEdits"`.

> To invoke the overlay, **hold the configured key combination and click with the left mouse button simultaneously**.

### Click Trigger Example

```html
<button data-dom-xray>Inspect this component</button>
```

Clicking this button opens the overlay and displays the current page source.

## How It Works (Dev Mode Only)

1. **Compile-time injection**: The plugin injects `data-source="filePath:line"` attributes into source code during development
   - **JSX/TSX** (React, SolidJS, Vue3 JSX): Injected via Babel AST
   - **Vue3 SFC `<template>`**: Parsed via `@vue/compiler-sfc` + `htmlparser2`
   - **Svelte**: Parsed via `svelte/compiler` + `magic-string` for precise insertion
   - **Nuxt 3**: Injected at compile time via Vue compiler `nodeTransforms`
   - **Angular**: Intercepts Angular compiler's HTML template reads via `fs.readFileSync` monkey-patch, injecting attributes before reads
2. **Click positioning**: When holding the shortcut and clicking a page element, traverses up the DOM from the click target to find the nearest `data-source`
3. **Overlay display**:
   - Left source panel automatically matches and highlights the corresponding source file
   - Top shows the file path; clicking "Open" jumps to the configured editor
   - Right side is a free input area for prompts or notes
4. **Data submission**: Clicking **Confirm** sends `{ source, filePath, input, timestamp }` to the `onSubmit` handler

## Submit Data Processing

By default, submitted data is returned directly by the dev server (`onSubmit: "return"`).

### Custom Handler (via plugin options)

```ts
// vite.config.ts
import domXray from "@dom-xray/vite";

export default defineConfig({
  plugins: [
    domXray({
      onSubmit: async (data) => {
        await fetch("http://localhost:3000/api/llm-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      },
    }),
  ],
});
```

## Local Development (Monorepo)

This repository uses `pnpm` workspaces + `turbo`.

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Watch mode development
pnpm dev
```

## Local Testing (Playground)

The `examples/` directory contains multiple test projects integrating different bundlers:

```bash
# Ensure plugins are built first
pnpm build

# Start Vite test project (port 5173)
pnpm dev:vite

# Start Webpack test project (port 8081)
pnpm dev:webpack

# Start Rspack test project (port 8082)
pnpm dev:rspack

# Start Vue CLI test project (port 8083)
pnpm dev:vue-cli

# Start Next.js test project (port 3000)
pnpm dev:nextjs

# Start Nuxt 3 test project (port 8088)
pnpm dev:nuxt

# Start Angular test project (port 8089, API server auto-starts)
pnpm dev:angular
```

Each test project includes:
- Multi-page routing via `react-router-dom` (Dashboard, User Management, Data Reports)
- Admin dashboard UI built with Ant Design
- `MainLayout` with sidebar navigation + header toolbar

Open a test page, hold `Option` (or `Alt`) and click any element to invoke the DOM XRay overlay and view the corresponding source code.

## Packages

| Package | Description |
| --- | --- |
| `@dom-xray/core` | Shared config loader, multi-framework source transformer (Babel / Vue / Svelte), type definitions, and dev server utilities |
| `@dom-xray/overlay-ui` | In-browser overlay UI built with Web Components + Shadow DOM |
| `@dom-xray/vite` | Vite plugin adapter |
| `@dom-xray/webpack` | Webpack 5 plugin adapter (includes Vue CLI support) |
| `@dom-xray/rspack` | Rspack 2+ plugin adapter |
| `@dom-xray/nextjs` | Next.js plugin adapter, supports Turbopack and webpack modes |
| `@dom-xray/nuxt` | Nuxt 3 module, injects via Vue compiler `nodeTransforms` |
| `@dom-xray/angular` | Angular v17+ support, intercepts template reads via `fs.readFileSync` patch |

## License

MIT
