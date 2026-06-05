# DOM Selector（源码定位 / LLM 开发工具）

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
npm i -D @dom-selector/vite

# Webpack
npm i -D @dom-selector/webpack

# Rspack
npm i -D @dom-selector/rspack

# Next.js
npm i -D @dom-selector/nextjs

# Nuxt 3
npm i -D @dom-selector/nuxt

# Angular (v17+)
npm i -D @dom-selector/angular
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
import domSelector from "@dom-selector/vite";

export default defineConfig({
  plugins: [
    domSelector({
      // 可选：自定义编辑器，默认 vscode
      editor: "cursor",
    }),
  ],
});
```

### Webpack（webpack.config.js）

```js
import { DOMSelectorPlugin } from "@dom-selector/webpack";

export default {
  plugins: [
    new DOMSelectorPlugin({
      editor: "vscode",
    }),
  ],
};
```

### Rspack（rspack.config.js）

```js
import { DOMSelectorRspackPlugin } from "@dom-selector/rspack";

export default {
  plugins: [
    new DOMSelectorRspackPlugin({
      editor: "zed",
    }),
  ],
};
```

### Next.js（next.config.js）

```js
const { withDomSelector } = require("@dom-selector/nextjs");

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
      "@dom-selector/nuxt",
      {
        editor: "vscode",
      },
    ],
  ],
});
```

Nuxt 模块通过 Vue 编译器的 `nodeTransforms` 在编译阶段向模板元素注入 `data-source`，同时提供 Nitro API 路由和客户端插件。

### Angular（v17+）

安装后使用 `dom-selector-ng` 命令替代 `ng`：

```bash
npm i -D @dom-selector/angular
```

**1. 修改 `package.json` scripts：**

```json
{
  "scripts": {
    "start": "dom-selector-ng serve --port 8089",
    "build": "ng build"
  }
}
```

`dom-selector-ng` 会自动完成：
- 拦截 Angular 编译器读取 HTML 模板的过程，注入 `data-source`
- 拦截 `.ts` 文件中的内联模板（`template: \`...\``），注入 `data-source`
- 启动 API 服务器（端口 8090），支持源码查询、提交和 AI Agent SSE 流
- **自动在 `index.html` 中注入 client 脚本和配置**（仅开发模式，通过代理拦截实现）
- 透传所有参数给 Angular CLI
- 支持完整的 `dom-selector.config.json` 配置（包括 `agentConfig`）

> **为什么不需要修改 `angular.json` 或 `src/index.html`？**
> `dom-selector-ng serve` 会启动一个轻量级代理：
> - 在返回 `index.html` 时自动注入 `<script src="/__dom-selector/client.js">`
> - `/__dom-selector/*` 请求代理到 API 服务器
> - 其余请求和 HMR WebSocket 直接转发给 Angular dev server
> 
> 生产构建（`ng build`）不经过该代理，因此生产产物完全保持干净。

## 配置

在项目根目录创建 `dom-selector.config.json`（或在 `package.json` 中添加 `domSelector` 字段）：

```json
{
  "title": "DOM Selector",
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
| `title` | `"DOM Selector"` | 弹窗标题 |
| `hotkey.mac` | `"option"` | macOS 快捷键 |
| `hotkey.win` | `"alt"` | Windows / Linux 快捷键 |
| `editor` | `"vscode"` | 源码面板"打开"按钮跳转的编辑器。可选：`vscode`、`cursor`、`zed`、`trae` |
| `clickSelector` | `"[data-dom-selector]"` | 点击触发的 CSS 选择器。设置为 `false` 可禁用 |
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

`agentConfig` 用于在弹窗中直接与 AI Agent（如 Cursor、OpenCode）交互，提交源码和问题后实时流式返回答案。

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
      "key": "your_opencode_api_key",
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
| `options.key` | — | OpenCode API Key。也可通过环境变量 `OPENCODE_API_KEY` 设置 |
| `options.baseUrl` | `"http://localhost:4096"` | OpenCode 本地服务器地址 |
| `options.providerID` | `"deepseek"` | 模型提供商 ID |
| `options.model` | `"deepseek-v4-pro"` | 模型 ID |

> 唤起弹窗需要**同时按住配置的按键组合并点击鼠标左键**。

### 点击触发示例

```html
<button data-dom-selector>检查此组件</button>
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

打开测试页面后，按住 `Option`（或 `Alt`）并点击任意元素，即可唤起 DOM Selector 弹窗查看对应源码。

## 包说明

| 包名 | 说明 |
| --- | --- |
| `@dom-selector/core` | 共享配置加载器、多框架源码转换器（Babel / Vue / Svelte）、类型定义和开发服务器辅助工具 |
| `@dom-selector/overlay-ui` | 浏览器内覆盖层 UI，使用 Web Components + Shadow DOM 构建 |
| `@dom-selector/vite` | Vite 插件适配器 |
| `@dom-selector/webpack` | Webpack 5 插件适配器（含 Vue CLI 支持） |
| `@dom-selector/rspack` | Rspack 2+ 插件适配器 |
| `@dom-selector/nextjs` | Next.js 插件适配器，支持 Turbopack 和 webpack 模式 |
| `@dom-selector/nuxt` | Nuxt 3 模块，通过 Vue 编译器 `nodeTransforms` 注入 |
| `@dom-selector/angular` | Angular v17+ 支持，通过 `fs.readFileSync` patch 拦截模板读取 |

## 开源协议

MIT
