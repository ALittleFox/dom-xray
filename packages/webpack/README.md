# @dom-xray/webpack

> [中文版本](README.zh-CN.md)

DOM XRay Webpack 5 plugin adapter. Injects `data-source` attributes at compile time for JSX/TSX, Vue SFC, and Svelte files. Supports Vue CLI projects.

## Installation

```bash
npm i -D @dom-xray/webpack
```

## Usage

### webpack.config.js

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

### Vue CLI (vue.config.mjs)

```js
import { DomXrayPlugin } from "@dom-xray/webpack";

export default {
  configureWebpack: {
    plugins: [new DomXrayPlugin()],
  },
};
```

If you need to use the loader in `chainWebpack`:

```js
import { domSelectorLoaderPath } from "@dom-xray/core";

export default {
  chainWebpack(config) {
    config.module
      .rule("dom-xray")
      .before("vue")
      .test(/\.(jsx|tsx|vue|svelte)$/)
      .use("dom-xray-loader")
      .loader(domSelectorLoaderPath);
  },
};
```

## Configuration

```ts
interface DomXrayWebpackOptions {
  title?: string;
  hotkey?: { mac?: string; win?: string };
  editor?: "vscode" | "cursor" | "zed" | "trae";
  clickSelector?: string | false;
  targetFilePatterns?: string[];
  onSubmit?: "return" | string | ((data: SubmitPayload) => void | Promise<void>);
  agentConfig?: AgentConfig;
}
```

See full configuration in the root [README.md](https://github.com/ALittleFox/dom-xray#readme).

## Features

- **Dev-only**: Throws an error automatically in non-development mode
- **Auto-inject client entry**: Injects `@dom-xray/overlay-ui/dist/client.js` into webpack entry
- **DefinePlugin global constants**: `__DOM_XRAY_CONFIG__`, `__DOM_XRAY_API__`
- **devServer middleware auto-mount**: Registers `/__dom-xray/api/*` routes via `setupMiddlewares`
- **Manual middleware mount (Vue CLI scenario)**:

```js
const plugin = new DomXrayPlugin();
plugin.mountMiddlewares(app);
```
