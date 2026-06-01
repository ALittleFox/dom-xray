# DOM Selector (for LLMs / Dev Tools)

A framework-agnostic, dev-mode plugin for **webpack**, **Vite**, and **Rspack** that lets you quickly open a checkpointed overlay to inspect source code and attach notes/prompts.

This is especially useful when you want to:
- Quickly capture source code + context and send it to an LLM.
- Leave runtime notes on the current component / module.
- Extract current source context during development with a single hotkey or a click.

## Features

- **One hotkey away**: macOS `⌘ + Option` / Windows & Linux `Ctrl + Alt`
- **Click to trigger**: Click any element with `data-dom-selector` attribute (configurable).
- **Side-by-side overlay**: Code on the left, your input/notes on the right.
- **Multi-bundler**: Works with `webpack 5`, `Vite 5/6`, and `Rspack 1+`.
- **Configurable**: Via `dom-selector.config.json` or the `domSelector` field in `package.json`.

## Install

Pick the adapter for your build tool:

```bash
# Vite
npm i -D @dom-selector/vite

# Webpack
npm i -D @dom-selector/webpack

# Rspack
npm i -D @dom-selector/rspack
```

### Vite (vite.config.ts)

```ts
import { defineConfig } from "vite";
import domSelector from "@dom-selector/vite";

export default defineConfig({
  plugins: [domSelector()],
});
```

### Webpack (webpack.config.js)

```js
const { DOMSelectorPlugin } = require("@dom-selector/webpack");

module.exports = {
  plugins: [new DOMSelectorPlugin()],
};
```

### Rspack (rspack.config.js)

```js
const { DOMSelectorRspackPlugin } = require("@dom-selector/rspack");

module.exports = {
  plugins: [new DOMSelectorRspackPlugin()],
};
```

## Configuration

Create a `dom-selector.config.json` in your project root (or add a `domSelector` field in `package.json`):

```json
{
  "title": "DOM Selector",
  "hotkey": {
    "mac": "command+option",
    "win": "ctrl+alt"
  },
  "clickSelector": "[data-dom-selector]",
  "onSubmit": "return"
}
```

### Options

| Option | Default | Description |
| --- | --- | --- |
| `title` | `"DOM Selector"` | Title of the overlay dialog. |
| `hotkey.mac` | `"command+option"` | Hotkey on macOS. Supported modifiers: `command` / `meta` / `ctrl` / `alt` / `option` / `shift`. |
| `hotkey.win` | `"ctrl+alt"` | Hotkey on Windows / Linux. |
| `clickSelector` | `"[data-dom-selector]"` | CSS selector for click-to-trigger. Set to `false` to disable. |
| `targetFilePatterns` | — | Optional array of glob patterns to restrict which source files are shown. |
| `onSubmit` | `"return"` | Can be: `"return"` to return data via the API endpoint, a URL string, or a function `(data) => void \| Promise<void>`. |

### Click trigger example

```html
<button data-dom-selector>Inspect this</button>
```

Clicking the button (with right-click or regular click, as configured) opens the overlay with the current page’s source modules.

## How it works (dev only)

- The plugin injects a small client runtime into the page (only in development).
- When the hotkey is pressed (or the click target is matched), a dialog overlays the viewport.
- The left pane lists the currently compiled source files (e.g. `App.tsx`, `Button.vue`, etc.) and lets you inspect their code.
- The right pane is a free-form input where you can type a prompt or note.
- On **Confirm**, the payload `{ source, filePath, input, timestamp }` is submitted to the dev server or your custom `onSubmit` handler.

## Submitting data

By default, submitted data is simply echoed back by the dev server (`onSubmit: "return"`).

You can customize where the payload goes:

### 1. Forward to an API endpoint

```json
{
  "onSubmit": "http://localhost:3000/api/notes"
}
```

*(Note: forwarding via config string will be resolved by the dev-server middleware in a future version. For now, handle it in your own proxy / server or use the function form below.)*

### 2. Custom handler (JS config via plugin options)

Because `onSubmit` can also be a function, you usually pass it in the plugin options directly (not in JSON configs):

```ts
// vite.config.ts
import domSelector from "@dom-selector/vite";

export default defineConfig({
  plugins: [
    domSelector({
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

## Monorepo / Development

This repository uses `pnpm` workspaces. To build all packages:

```bash
# Install dependencies
pnpm install

# Build everything
pnpm build

# Watch mode for local development
pnpm dev
```

## Packages

| Package | Description |
| --- | --- |
| `@dom-selector/core` | Shared config loader, types, and dev-server helpers. |
| `@dom-selector/overlay-ui` | The in-browser overlay UI (built as an IIFE bundle). |
| `@dom-selector/vite` | Vite plugin adapter. |
| `@dom-selector/webpack` | Webpack 5 plugin adapter. |
| `@dom-selector/rspack` | Rspack 1+ plugin adapter. |

## License

MIT
