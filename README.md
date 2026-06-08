# DOM XRay

[中文](#中文) | [English](#english)

---

<a id="中文"></a>

# DOM XRay（源码定位 / LLM 开发工具）

一个与框架无关的**开发模式**插件，支持 **Vite**、**Webpack**、**Rspack**、**Next.js**、**Nuxt 3** 和 **Angular**。通过快捷键 + 鼠标点击快速唤起源码弹窗，精准定位到组件源码位置，支持发送给 LLM 或在编辑器中直接打开。

## 功能特性

- **一键唤起**：macOS `Option + 点击` / Windows & Linux `Alt + 点击`（支持自定义组合键）
- **编译时精准定位**：在 JSX/TSX、Vue SFC `<template>`、Svelte、Angular HTML 模板编译阶段注入 `data-source` 属性，点击元素时直接映射到源码文件和行号
- **向上查找**：点击子元素时，自动向上遍历 DOM 查找最近的 `data-source`，确保始终定位到最相关的组件
- **源码语法高亮**：弹窗左侧源码面板支持 JSX / TSX 语法高亮
- **在编辑器中打开**：源码面板内置"打开"按钮，支持一键跳转到 VSCode / Cursor / Zed / Trae
- **多框架支持**：React / SolidJS / Vue3（JSX 与 SFC `<template>`）/ Svelte / Angular
- **多构建工具**：支持 `Vite 5/6/8`、`Webpack 5`、`Rspack 2+`、`Next.js`、`Nuxt 3`、`Angular v17+`
- **Web Components 弹窗**：使用 Shadow DOM 实现，样式隔离，不污染宿主页面

## 安装

根据你使用的构建工具选择对应的插件包：

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

**Vue 或 Svelte 项目**需要额外安装对应编译器（core 会动态加载，按需使用）：

```bash
# Vue3 SFC 支持
npm i -D @vue/compiler-sfc

# Svelte 支持
npm i -D svelte
```

### Vite（vite.config.ts）

```ts
import { defineConfig } from "vite";
import domXray from "@dom-xray/vite";

export default defineConfig({
  plugins: [
    domXray({
      // 可选：自定义编辑器，默认 vscode
      editor: "cursor",
    }),
  ],
});
```

### Webpack（webpack.config.js）

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

### Rspack（rspack.config.js）

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

### Next.js（next.config.js）

```js
const { withDomSelector } = require("@dom-xray/nextjs");

module.exports = withDomSelector(
  { reactStrictMode: true },
  { title: "My App", editor: "vscode" }
);
```

支持 Turbopack 和 webpack 两种模式。Turbopack 下通过 `turbopack.rules` 注入 webpack loader 兼容规则；webpack 模式下直接注册 pre-loader。

### Nuxt 3（nuxt.config.ts）

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

Nuxt 模块通过 Vue 编译器的 `nodeTransforms` 在编译阶段向模板元素注入 `data-source`，同时提供 Nitro API 路由和客户端插件。

### Angular（v17+）

安装后使用 `dom-xray-ng` 命令替代 `ng`：

```bash
npm i -D @dom-xray/angular
```

**1. 修改 `package.json` scripts：**

```json
{
  "scripts": {
    "start": "dom-xray-ng serve --port 8089",
    "build": "ng build"
  }
}
```

`dom-xray-ng` 会自动完成：
- 拦截 Angular 编译器读取 HTML 模板的过程，注入 `data-source`
- 拦截 `.ts` 文件中的内联模板（`template: \`...\``），注入 `data-source`
- 启动 API 服务器（端口 8090），支持源码查询、提交和 AI Agent SSE 流
- **自动在 `index.html` 中注入 client 脚本和配置**（仅开发模式，通过代理拦截实现）
- 透传所有参数给 Angular CLI
- 支持完整的 `dom-xray.config.json` 配置（包括 `agentConfig`）

> **为什么不需要修改 `angular.json` 或 `src/index.html`？**
> `dom-xray-ng serve` 会启动一个轻量级代理：
> - 在返回 `index.html` 时自动注入 `<script src="/__dom-xray/client.js">`
> - `/__dom-xray/*` 请求代理到 API 服务器
> - 其余请求和 HMR WebSocket 直接转发给 Angular dev server
>
> 生产构建（`ng build`）不经过该代理，因此生产产物完全保持干净。

## 配置

在项目根目录创建 `dom-xray.config.json`（或在 `package.json` 中添加 `domXray` 字段）：

```json
{
  "title": "DOM XRay",
  "hotkey": {
    "mac": "option",
    "win": "alt"
  },
  "editor": "vscode",
  "onSubmit": "return",
  "agentConfig": {
    "type": "cursor",
    "options": {
      "key": "your_cursor_api_key"
    }
  }
}
```

### 配置项

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `title` | `"DOM XRay"` | 弹窗标题 |
| `hotkey.mac` | `"option"` | macOS 快捷键 |
| `hotkey.win` | `"alt"` | Windows / Linux 快捷键 |
| `editor` | `"vscode"` | 源码面板"打开"按钮跳转的编辑器。可选：`vscode`、`cursor`、`zed`、`trae` |
| `clickSelector` | `"[data-dom-xray]"` | 点击触发的 CSS 选择器。设置为 `false` 可禁用 |
| `targetFilePatterns` | — | 可选的 glob 模式数组，用于限制显示哪些源文件 |
| `onSubmit` | `"return"` | 可选值：`"return"`（通过 API 返回数据）、URL 字符串、或函数 `(data) => void \| Promise<void>` |
| `agentConfig` | — | AI Agent 配置，用于在弹窗中直接与 LLM 交互。示例见下方 |

### 支持的按键组合

`hotkey` 支持单个按键或组合键，使用 `+` 或空格连接。

**支持的按键名称：**

| 按键 | 别名 |
| --- | --- |
| `command`（⌘） | `command`、`cmd`、`meta` |
| `ctrl`（Ctrl） | `ctrl`、`control` |
| `alt`（⌥） | `alt`、`option` |
| `shift`（⇧） | `shift` |

**常用组合示例：**

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

### Agent 配置

`agentConfig` 用于在弹窗中直接与 AI Agent（如 Cursor、OpenCode、Claude）交互，提交源码和问题后实时流式返回答案。

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

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `type` | — | `"cursor"` |
| `options.key` | — | Cursor API Key。也可通过环境变量 `CURSOR_API_KEY` 设置 |
| `options.model` | `"composer-2.5"` | 使用的模型 ID |

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

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `type` | — | `"opencode"` |
| `options.baseUrl` | `"http://localhost:4096"` | OpenCode 本地服务器地址 |
| `options.providerID` | `"deepseek"` | 模型提供商 ID |
| `options.model` | `"deepseek-v4-pro"` | 模型 ID |

> **注意**：使用 OpenCode 前，请先启动 OpenCode Web 服务：
> ```bash
> opencode web
> ```
> 确保服务监听在配置的 `baseUrl`（默认 `http://localhost:4096`）。
>
> OpenCode 使用本地服务器自身的鉴权配置，无需在插件中额外设置 API Key。

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

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `type` | — | `"claude"` |
| `options.model` | — | 可选，覆盖 Claude Code 本地默认模型。留空则使用本地 Claude Code 配置 |
| `options.permissionMode` | `"acceptEdits"` | 权限模式：`acceptEdits`（自动接受文件编辑，默认）、`default`（需授权）、`auto`（模型自动批准）、`plan`（仅规划）、`bypassPermissions`（绕过所有权限，慎用） |

> **注意**：使用 Claude Agent 前，请确保本地已安装并配置好 Claude Code。
> Claude Code 使用本地自身的鉴权和模型配置，无需在插件中设置 API Key。
> 若本地已将 Claude Code 模型改为 DeepSeek 等第三方模型，SDK 会自动沿用该配置。
>
> 若希望 Agent 直接修改代码而不弹出授权提示，请将 `permissionMode` 设为 `"acceptEdits"`。

> 唤起弹窗需要**同时按住配置的按键组合并点击鼠标左键**。

### 点击触发示例

```html
<button data-dom-xray>检查此组件</button>
```

点击该按钮即可打开弹窗，显示当前页面源码。

## 工作原理（仅开发模式）

1. **编译时注入**：插件在开发模式下向源码注入 `data-source="filePath:line"` 属性
   - **JSX/TSX**（React、SolidJS、Vue3 JSX）：通过 Babel AST 注入
   - **Vue3 SFC `<template>`**：通过 `@vue/compiler-sfc` 解析 + `htmlparser2` 注入
   - **Svelte**：通过 `svelte/compiler` 解析 + `magic-string` 精准插入
   - **Nuxt 3**：通过 Vue 编译器 `nodeTransforms` 在编译阶段注入
   - **Angular**：通过 `fs.readFileSync` monkey-patch 拦截 Angular 编译器读取 HTML 模板的过程，在读取前注入属性
2. **点击定位**：按住快捷键并点击页面元素时，从点击目标向上遍历 DOM，找到最近的 `data-source`
3. **弹窗展示**：
   - 左侧源码面板自动匹配并高亮显示对应源码文件
   - 顶部显示文件路径，点击"打开"按钮可跳转到配置的编辑器
   - 右侧是自由输入区域，可输入提示词或备注
4. **提交数据**：点击**确定**后，数据 `{ source, filePath, input, timestamp }` 发送到 `onSubmit` 处理器

## 提交数据处理

默认情况下，提交的数据由开发服务器直接返回（`onSubmit: "return"`）。

### 自定义处理器（通过插件选项传入函数）

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

## 本地开发（Monorepo）

本仓库使用 `pnpm` workspaces + `turbo`。

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 监听模式开发
pnpm dev
```

## 本地测试环境（Playground）

`examples/` 目录下包含多个测试项目，分别集成了不同构建工具：

```bash
# 先确保插件已构建
pnpm build

# 启动 Vite 测试项目（端口 5173）
pnpm dev:vite

# 启动 Webpack 测试项目（端口 8081）
pnpm dev:webpack

# 启动 Rspack 测试项目（端口 8082）
pnpm dev:rspack

# 启动 Vue CLI 测试项目（端口 8083）
pnpm dev:vue-cli

# 启动 Next.js 测试项目（端口 3000）
pnpm dev:nextjs

# 启动 Nuxt 3 测试项目（端口 8088）
pnpm dev:nuxt

# 启动 Angular 测试项目（端口 8089，需同时启动 API 服务器）
pnpm dev:angular
```

每个测试项目包含：
- 基于 `react-router-dom` 的多页面路由（仪表盘、用户管理、数据报表）
- Ant Design 组件库构建的后台管理系统界面
- `MainLayout` 侧边栏导航 + 头部工具栏

打开测试页面后，按住 `Option`（或 `Alt`）并点击任意元素，即可唤起 DOM XRay 弹窗查看对应源码。

## 包说明

| 包名 | 说明 |
| --- | --- |
| `@dom-xray/core` | 共享配置加载器、多框架源码转换器（Babel / Vue / Svelte）、类型定义和开发服务器辅助工具 |
| `@dom-xray/overlay-ui` | 浏览器内覆盖层 UI，使用 Web Components + Shadow DOM 构建 |
| `@dom-xray/vite` | Vite 插件适配器 |
| `@dom-xray/webpack` | Webpack 5 插件适配器（含 Vue CLI 支持） |
| `@dom-xray/rspack` | Rspack 2+ 插件适配器 |
| `@dom-xray/nextjs` | Next.js 插件适配器，支持 Turbopack 和 webpack 模式 |
| `@dom-xray/nuxt` | Nuxt 3 模块，通过 Vue 编译器 `nodeTransforms` 注入 |
| `@dom-xray/angular` | Angular v17+ 支持，通过 `fs.readFileSync` patch 拦截模板读取 |

## 开源协议

MIT

---

<a id="english"></a>

# DOM XRay (Source Code Locator / LLM Dev Tool)

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
  "editor": "vscode",
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
| `editor` | `"vscode"` | Editor for the "Open" button. Options: `vscode`, `cursor`, `zed`, `trae` |
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
