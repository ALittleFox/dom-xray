# @dom-xray/core

> [中文版本](README.zh-CN.md)

DOM XRay core utilities. Provides configuration loading, multi-framework source transformation (Babel / Vue / Svelte), dev server helpers, and AI Agent middleware.

This package is usually installed automatically as an internal dependency of downstream adapters (`@dom-xray/vite`, `@dom-xray/webpack`, etc.). **You generally do not need to install it directly.**

## Installation

```bash
npm i -D @dom-xray/core
```

## API

### `loadConfig(cwd?)`

Loads `dom-xray.config.json` or the `domXray` field in `package.json`.

```ts
import { loadConfig } from "@dom-xray/core";

const config = loadConfig(process.cwd());
```

### `resolveClientPath()`

Resolves the absolute path to `@dom-xray/overlay-ui/dist/client.js`, used by adapters to serve the client script in the dev server.

```ts
import { resolveClientPath } from "@dom-xray/core";

const clientPath = resolveClientPath();
```

### `injectDataSource(code, filePath)`

Injects `data-source` attributes into elements at compile time.

- `.jsx` / `.tsx` → Babel AST transformation
- `.vue` → `@vue/compiler-sfc` + `htmlparser2`
- `.svelte` → `svelte/compiler` + `magic-string`

```ts
import { injectDataSource } from "@dom-xray/core";

const result = await injectDataSource(sourceCode, "/path/to/App.tsx");
// result.code  transformed code
// result.map   optional source map
```

### `createAgentMiddleware(config)`

Creates AI Agent SSE streaming middleware, supporting Cursor, OpenCode, and Claude agents.

```ts
import { createAgentMiddleware } from "@dom-xray/core";

const middleware = createAgentMiddleware(config);
// mount at /__dom-xray/api/agent
```

### Loader

`domSelectorLoaderPath` points to the core loader entry, used by Webpack / Rspack / Next.js to inject `data-source` at the `enforce: "pre"` stage.

```js
{
  enforce: "pre",
  test: /\.(jsx|tsx|vue|svelte)$/,
  use: [{ loader: require("@dom-xray/core").domSelectorLoaderPath }],
}
```

## Type Definitions

```ts
import type { PluginConfig, SourceInfo, InspectTarget } from "@dom-xray/core";
```

See full type definitions in [`src/types.ts`](./src/types.ts).
