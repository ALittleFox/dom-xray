# DOM Selector（源码定位 / LLM 开发工具）

一个与框架无关的**开发模式**插件，支持 **Vite**、**Webpack** 和 **Rspack**。通过快捷键 + 鼠标点击快速唤起源码弹窗，精准定位到组件源码位置，支持发送给 LLM 或在编辑器中直接打开。

## 功能特性

- **一键唤起**：macOS `⌘ + 点击` / Windows & Linux `Ctrl + 点击`（支持自定义组合键）
- **编译时精准定位**：在 JSX/TSX 编译阶段注入 `data-source` 属性，点击元素时直接映射到源码文件和行号
- **向上查找**：点击子元素时，自动向上遍历 DOM 查找最近的 `data-source`，确保始终定位到最相关的组件
- **源码语法高亮**：弹窗左侧源码面板支持 JSX / TSX 语法高亮
- **在编辑器中打开**：源码面板内置"打开"按钮，支持一键跳转到 VSCode / Cursor / Zed / Trae
- **多构建工具**：支持 `Vite 5/6/8`、`Webpack 5` 和 `Rspack 2+`
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

## 配置

在项目根目录创建 `dom-selector.config.json`（或在 `package.json` 中添加 `domSelector` 字段）：

```json
{
  "title": "DOM Selector",
  "hotkey": {
    "mac": "command",
    "win": "ctrl"
  },
  "editor": "vscode",
  "onSubmit": "return"
}
```

### 配置项

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `title` | `"DOM Selector"` | 弹窗标题 |
| `hotkey.mac` | `"command"` | macOS 快捷键 |
| `hotkey.win` | `"ctrl"` | Windows / Linux 快捷键 |
| `editor` | `"vscode"` | 源码面板"打开"按钮跳转的编辑器。可选：`vscode`、`cursor`、`zed`、`trae` |
| `clickSelector` | `"[data-dom-selector]"` | 点击触发的 CSS 选择器。设置为 `false` 可禁用 |
| `targetFilePatterns` | — | 可选的 glob 模式数组，用于限制显示哪些源文件 |
| `onSubmit` | `"return"` | 可选值：`"return"`（通过 API 返回数据）、URL 字符串、或函数 `(data) => void \| Promise<void>` |

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
    "mac": "command",
    "win": "ctrl"
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

> 唤起弹窗需要**同时按住配置的按键组合并点击鼠标左键**。

### 点击触发示例

```html
<button data-dom-selector>检查此组件</button>
```

点击该按钮即可打开弹窗，显示当前页面源码。

## 工作原理（仅开发模式）

1. **编译时注入**：插件在开发模式下通过 Babel 解析 JSX/TSX，向每个 JSX 元素注入 `data-source="filePath:line"` 属性
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

`examples/` 目录下包含三个 antd 后台管理系统的测试项目，分别集成了 Vite、Webpack 和 Rspack：

```bash
# 先确保插件已构建
pnpm build

# 启动 Vite 测试项目（端口 5173）
pnpm dev:vite

# 启动 Webpack 测试项目（端口 8081）
pnpm dev:webpack

# 启动 Rspack 测试项目（端口 8082）
pnpm dev:rspack
```

每个测试项目包含：
- 基于 `react-router-dom` 的多页面路由（仪表盘、用户管理、数据报表）
- Ant Design 组件库构建的后台管理系统界面
- `MainLayout` 侧边栏导航 + 头部工具栏

打开测试页面后，按住 `⌘`（或 `Ctrl`）并点击任意元素，即可唤起 DOM Selector 弹窗查看对应源码。

## 包说明

| 包名 | 说明 |
| --- | --- |
| `@dom-selector/core` | 共享配置加载器、Babel 源码转换器、类型定义和开发服务器辅助工具 |
| `@dom-selector/overlay-ui` | 浏览器内覆盖层 UI，使用 Web Components + Shadow DOM 构建 |
| `@dom-selector/vite` | Vite 插件适配器 |
| `@dom-selector/webpack` | Webpack 5 插件适配器 |
| `@dom-selector/rspack` | Rspack 2+ 插件适配器 |

## 开源协议

MIT
