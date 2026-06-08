# @dom-xray/angular

> [中文版本](README.zh-CN.md)

DOM XRay Angular v17+ integration package. Intercepts Angular compiler's HTML template reads via `fs.readFileSync` monkey-patch, injecting `data-source` attributes at compile time.

## Installation

```bash
npm i -D @dom-xray/angular
```

## Usage

### 1. Update `package.json` scripts

Replace `ng` with `dom-xray-ng`:

```json
{
  "scripts": {
    "start": "dom-xray-ng serve --port 8089",
    "build": "ng build"
  }
}
```

### 2. Start the dev server

```bash
npm run start
```

`dom-xray-ng` automatically handles:

- Intercepting Angular compiler's `.html` template reads and injecting `data-source`
- Intercepting inline templates in `.ts` files (`template: \`...\``) and injecting `data-source`
- Starting an API server (port 8090) supporting source queries, submissions, and AI Agent SSE streaming
- **Auto-injecting client script and config into `index.html`** (dev mode only, via proxy interception)
- Passing all arguments through to the Angular CLI
- Supporting full `dom-xray.config.json` configuration (including `agentConfig`)

> **Why don't you need to modify `angular.json` or `src/index.html`?**
> `dom-xray-ng serve` starts a lightweight proxy:
> - Automatically injects `<script src="/__dom-xray/client.js">` when serving `index.html`
> - Proxies `/__dom-xray/*` requests to the API server
> - Forwards all other requests and HMR WebSockets directly to the Angular dev server
>
> Production builds (`ng build`) bypass this proxy, so production artifacts remain completely clean.

## Advanced Usage

### Mount middlewares in a custom dev server

If you have your own Angular dev server wrapper, you can manually mount middlewares:

```ts
import { mountMiddlewaresOnApp } from "@dom-xray/angular";

mountMiddlewaresOnApp(app, clientPath, () => collectSources(process.cwd()));
```

### esbuild plugin (experimental)

```ts
import { createDomSelectorEsbuildPlugin } from "@dom-xray/angular";

const plugin = createDomSelectorEsbuildPlugin();
```

### `fs.readFileSync` Patch (low-level API)

```ts
import { patchFsReadFile } from "@dom-xray/angular";

patchFsReadFile();
```

> **Note**: Angular's compiler reads templates directly via `fs.readFileSync` before esbuild processes `.html` files, so traditional esbuild `onLoad` cannot intercept it. You must use `patchFsReadFile()` to inject attributes at the file read stage.

## Configuration

Configure via `dom-xray.config.json` in the project root or the `domXray` field in `package.json`.

See full configuration in the root [README.md](https://github.com/ALittleFox/dom-xray#readme).
