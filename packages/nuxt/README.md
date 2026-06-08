# @dom-xray/nuxt

> [中文版本](README.zh-CN.md)

DOM XRay Nuxt 3 module adapter. Injects `data-source` attributes into template elements at compile time via Vue compiler `nodeTransforms`, and provides Nitro API routes and a client plugin.

## Installation

```bash
npm i -D @dom-xray/nuxt
```

## Usage

### nuxt.config.ts

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

Or the shorthand:

```ts
export default defineNuxtConfig({
  modules: ["@dom-xray/nuxt"],
  domXray: {
    editor: "cursor",
  },
});
```

## Configuration

```ts
interface DomXrayNuxtOptions {
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

- **Dev-only**: Production builds throw an error automatically
- **Vue compiler `nodeTransforms`**: Injects `data-source="filePath:line"` at template compile time, zero runtime overhead
- **Vite plugin integration**: Integrates source collection and JSX transformation via `addVitePlugin`
- **Standalone API server**: Starts an Express server providing `/__dom-xray/api/*` routes
- **Nitro proxy**: Proxies all `/__dom-xray/**` requests to the standalone server via `addServerHandler`
- **Client plugin auto-inject**: Injects config script and `client.js` into `<head>` via `addPlugin`
