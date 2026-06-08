# @dom-xray/vite

DOM XRay 的 Vite 插件适配器。支持 Vite 5/6/8 开发服务器，在编译阶段向 JSX/TSX、Vue SFC、Svelte 文件注入 `data-source` 属性，实现源码精准定位。

## 安装

```bash
npm i -D @dom-xray/vite
```

**Vue 或 Svelte 项目**需要额外安装对应编译器（core 会动态加载）：

```bash
# Vue3 SFC 支持
npm i -D @vue/compiler-sfc

# Svelte 支持
npm i -D svelte
```

## 用法

### vite.config.ts

```ts
import { defineConfig } from "vite";
import domXray from "@dom-xray/vite";

export default defineConfig({
  plugins: [
    domXray({
      editor: "cursor",
    }),
  ],
});
```

## 配置

所有选项均可在 `vite.config.ts` 中传入，也可通过项目根目录的 `dom-xray.config.json` 配置。

```ts
interface DomXrayViteOptions {
  title?: string;                // 弹窗标题，默认 "DOM XRay"
  hotkey?: { mac?: string; win?: string }; // 快捷键，默认 option / alt
  editor?: "vscode" | "cursor" | "zed" | "trae"; // 默认 vscode
  clickSelector?: string | false; // 点击触发选择器，默认 "[data-dom-xray]"
  targetFilePatterns?: string[];  // 限制显示的源文件 glob 模式
  onSubmit?: "return" | string | ((data: SubmitPayload) => void | Promise<void>);
  agentConfig?: AgentConfig;     // AI Agent 配置
}
```

完整配置说明见根目录 [README.md](../../README.md)。

## 功能特性

- **开发模式专用**：生产构建 (`NODE_ENV=production`) 会自动报错，防止意外引入
- **自动注入客户端脚本**：通过 `transformIndexHtml` 在 `<head>` 中注入配置和 `client.js`
- **源码收集**：通过 `load` / `transform` 钩子收集 `.js/.jsx/.ts/.tsx/.vue/.svelte` 原始源码
- **API 路由**：在 Vite dev server 中挂载 `/__dom-xray/api/sources`、`/api/submit`、`/api/agent`
