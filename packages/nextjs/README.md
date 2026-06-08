# @dom-xray/nextjs

> [中文版本](README.zh-CN.md)

DOM XRay Next.js plugin adapter. Supports both **Turbopack** and **webpack** modes.

## Installation

```bash
npm i -D @dom-xray/nextjs
```

## Usage

### next.config.mjs

```js
import { withDomSelector } from "@dom-xray/nextjs";

export default withDomSelector(
  { reactStrictMode: true },
  { title: "My App", editor: "vscode" }
);
```

### next.config.js (CommonJS)

```js
const { withDomSelector } = require("@dom-xray/nextjs");

module.exports = withDomSelector(
  { reactStrictMode: true },
  { title: "My App", editor: "vscode" }
);
```

## Configuration

The second argument is DOM XRay config; the first argument is the original Next.js config object.

```ts
interface DomXrayNextOptions {
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

- **Turbopack compatible**: Injects webpack-loader-compatible rules via `turbopack.rules` to inject `data-source` into `.jsx/.tsx/.vue/.svelte` files
- **webpack mode**: Registers `enforce: "pre"` loader and `DefinePlugin` directly
- **Standalone API server**: Starts an independent Express server providing `/__dom-xray/api/*` routes
- **Rewrite proxy**: Proxies `/__dom-xray/*` to the standalone server via Next.js `rewrites`
- **Client Script component**: Provides `DomSelectorScript` component (optional) for manually injecting the client script in `app/layout.tsx`:

```tsx
import { DomSelectorScript } from "@dom-xray/nextjs/client";

export default function Layout({ children }) {
  return (
    <html>
      <head>
        <DomSelectorScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

> **Dev-only**: Production builds (`NODE_ENV=production`) throw an error automatically.
