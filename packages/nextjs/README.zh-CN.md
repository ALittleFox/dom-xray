# @dom-xray/nextjs

DOM XRay 的 Next.js 插件适配器，同时支持 **Turbopack** 和 **webpack** 两种模式。

## 安装

```bash
npm i -D @dom-xray/nextjs
```

## 用法

### next.config.mjs

```js
import { withDomSelector } from "@dom-xray/nextjs";

export default withDomSelector(
  { reactStrictMode: true },
  { title: "My App", editor: "vscode" }
);
```

### next.config.js（CommonJS）

```js
const { withDomSelector } = require("@dom-xray/nextjs");

module.exports = withDomSelector(
  { reactStrictMode: true },
  { title: "My App", editor: "vscode" }
);
```

## 配置

第二个参数为 DOM XRay 配置，第一个参数为原始 Next.js 配置对象。

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

完整配置说明见根目录 [README.md](../../README.md)。

## 功能特性

- **Turbopack 兼容**：通过 `turbopack.rules` 注入 webpack loader 兼容规则，向 `.jsx/.tsx/.vue/.svelte` 文件注入 `data-source`
- **webpack 模式**：直接注册 `enforce: "pre"` loader 和 `DefinePlugin`
- **独立 API 服务器**：启动独立的 Express 服务器提供 `/__dom-xray/api/*` 路由
- **rewrite 代理**：通过 Next.js `rewrites` 将 `/__dom-xray/*` 代理到独立服务器
- **Client Script 组件**：提供 `DomSelectorScript` 组件（可选），用于在 `app/layout.tsx` 中手动注入客户端脚本：

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

> **开发模式专用**：生产构建 (`NODE_ENV=production`) 会自动报错。
