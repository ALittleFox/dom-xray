# DOM Selector（LLM / 开发工具插件）

一个与框架无关的**开发模式**插件，支持 **webpack**、**Vite** 和 **Rspack**。通过快捷键或鼠标点击快速弹出一个覆盖层，用来查看源码并输入备注 / 提示词。

特别适用于以下场景：
- 快速捕获源码 + 上下文，发送给 LLM。
- 在当前组件 / 模块上留下运行时备注。
- 通过单个快捷键或点击提取当前源码上下文。

## 功能特性

- **一键唤起**：macOS `⌘ + 点击` / Windows & Linux `Ctrl + 点击`（支持自定义组合键，如 `command+option`）
- **点击触发**：点击带有 `data-dom-selector` 属性的元素（可配置）。
- **左右分栏弹窗**：左侧显示源码，右侧输入备注 / 提示词。
- **多构建工具**：支持 `webpack 5`、`Vite 5/6` 和 `Rspack 1+`。
- **可配置**：通过 `dom-selector.config.json` 或 `package.json` 中的 `domSelector` 字段进行配置。

## 安装

根据你使用的构建工具选择对应的插件包：

```bash
# Vite
npm i -D @dom-selector/vite

# Webpack
npm i -D @dom-selector/webpack

# Rspack
npm i -D @dom-selector/rspack
```

### Vite（vite.config.ts）

```ts
import { defineConfig } from "vite";
import domSelector from "@dom-selector/vite";

export default defineConfig({
  plugins: [domSelector()],
});
```

### Webpack（webpack.config.js）

```js
const { DOMSelectorPlugin } = require("@dom-selector/webpack");

module.exports = {
  plugins: [new DOMSelectorPlugin()],
};
```

### Rspack（rspack.config.js）

```js
const { DOMSelectorRspackPlugin } = require("@dom-selector/rspack");

module.exports = {
  plugins: [new DOMSelectorRspackPlugin()],
};
```

## 配置

在项目根目录创建 `dom-selector.config.json`（或在 `package.json` 中添加 `domSelector` 字段）：

```json
{
  "title": "DOM Selector",
  "hotkey": {
    "mac": "command",
    "win": "ctrl"
  },
  "clickSelector": "[data-dom-selector]",
  "onSubmit": "return"
}
```

### 配置项

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `title` | `"DOM Selector"` | 弹窗标题。 |
| `hotkey.mac` | `"command"` | macOS 快捷键。默认仅 `command`（即 `⌘ + 点击`）。支持的修饰键：`command` / `meta` / `ctrl` / `alt` / `option` / `shift`。可配置组合键，如 `"command+option"`。 |
| `hotkey.win` | `"ctrl"` | Windows / Linux 快捷键。默认仅 `ctrl`（即 `Ctrl + 点击`）。可配置组合键，如 `"ctrl+shift"`。 |
| `clickSelector` | `"[data-dom-selector]"` | 点击触发的 CSS 选择器。设置为 `false` 可禁用点击触发。 |
| `targetFilePatterns` | — | 可选的 glob 模式数组，用于限制显示哪些源文件。 |
| `onSubmit` | `"return"` | 可选值：`"return"`（通过 API 端点返回数据）、URL 字符串、或函数 `(data) => void \| Promise<void>`。 |

### 点击触发示例

```html
<button data-dom-selector>检查此组件</button>
```

点击该按钮即可打开弹窗，显示当前页面已编译的源码模块。

## 工作原理（仅开发模式）

- 插件仅在开发模式下向页面注入一个轻量的客户端运行时。
- 按下快捷键（或匹配到点击目标）时，弹窗覆盖在视口中央。
- 左侧列出当前已编译的源文件（如 `App.tsx`、`Button.vue` 等），可查看源码。
- 右侧是自由输入区域，可输入提示词或备注。
- 点击**确定**后，提交的数据 `{ source, filePath, input, timestamp }` 会发送到开发服务器或你自定义的 `onSubmit` 处理器。

## 提交数据处理

默认情况下，提交的数据由开发服务器直接返回（`onSubmit: "return"`）。

你可以自定义数据去向：

### 1. 转发到 API 端点

```json
{
  "onSubmit": "http://localhost:3000/api/notes"
}
```

>（注：通过配置字符串转发将在后续版本中由开发服务器中间件处理。目前建议通过函数形式自行处理，见下文。）

### 2. 自定义处理器（通过插件选项传入函数）

由于 `onSubmit` 可以是函数，通常直接在插件选项中传入（而不是 JSON 配置文件）：

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

本仓库使用 `pnpm` workspaces。构建所有包：

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 本地开发（监听模式）
pnpm dev
```

## 本地测试环境（Playground）

仓库 `examples/` 目录下包含三个独立的测试项目，分别集成了 Vite、Webpack 和 Rspack 插件，用于本地调试：

```bash
# 先确保插件已构建
pnpm build

# 启动 Vite 测试项目（默认端口 5173）
pnpm dev:vite

# 启动 Webpack 测试项目（默认端口 8081）
pnpm dev:webpack

# 启动 Rspack 测试项目（默认端口 8082）
pnpm dev:rspack
```

每个测试项目都包含：
- 一个带有 `data-dom-selector` 属性的按钮（点击可唤起弹窗）
- 一份 `dom-selector.config.json` 配置文件
- 演示用的简单页面

打开测试页面后，按住快捷键（macOS `⌘` / Windows `Ctrl`）并点击页面元素，或点击蓝色按钮即可唤起 DOM Selector 弹窗进行调试。

## 包说明

| 包名 | 说明 |
| --- | --- |
| `@dom-selector/core` | 共享的配置加载器、类型定义和开发服务器辅助工具。 |
| `@dom-selector/overlay-ui` | 浏览器内覆盖层 UI（打包为 IIFE 格式）。 |
| `@dom-selector/vite` | Vite 插件适配器。 |
| `@dom-selector/webpack` | Webpack 5 插件适配器。 |
| `@dom-selector/rspack` | Rspack 1+ 插件适配器。 |

## 开源协议

MIT
