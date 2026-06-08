# @dom-xray/rspack

> [中文版本](README.zh-CN.md)

DOM XRay Rspack 2+ plugin adapter. Injects `data-source` attributes at compile time for JSX/TSX, Vue SFC, and Svelte files. Compatible with Rspack dev-server v2 `middlewares` API.

## Installation

```bash
npm i -D @dom-xray/rspack
```

## Usage

### rspack.config.js

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

## Configuration

```ts
interface DomXrayRspackOptions {
  title?: string;
  hotkey?: { mac?: string; win?: string };
  editor?: "vscode" | "cursor" | "zed" | "trae";
  clickSelector?: string | false;
  targetFilePatterns?: string[];
  onSubmit?: "return" | string | ((data: SubmitPayload) => void | Promise<void>);
  agentConfig?: AgentConfig;
}
```

See full configuration in the root [README.md](../../README.md).

## Features

- **Dev-only**: Throws an error automatically in non-development mode
- **Auto-inject client entry**: Injects `@dom-xray/overlay-ui/dist/client.js` into Rspack entry
- **DefinePlugin global constants**: `__DOM_XRAY_CONFIG__`, `__DOM_XRAY_API__`
- **devServer middlewares auto-mount**: Compatible with Rspack dev-server v2 `middlewares` array API
- **Source collection**: Collects raw `.js/.jsx/.ts/.tsx/.vue/.svelte` sources via `compilation.hooks.afterOptimizeModules`
