# @dom-xray/rspack

DOM XRay 的 Rspack 2+ 插件适配器。在编译阶段向 JSX/TSX、Vue SFC、Svelte 文件注入 `data-source` 属性，兼容 Rspack dev-server v2 的 `middlewares` API。

## 安装

```bash
npm i -D @dom-xray/rspack
```

## 用法

### rspack.config.js

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

## 配置

```ts
interface DomXrayRspackOptions {
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

- **开发模式专用**：非 development 模式会自动报错
- **自动注入客户端 entry**：将 `@dom-xray/overlay-ui/dist/client.js` 注入到 Rspack entry 中
- **DefinePlugin 注入全局常量**：`__DOM_XRAY_CONFIG__`、`__DOM_XRAY_API__`
- **devServer middlewares 自动挂载**：兼容 Rspack dev-server v2 的 `middlewares` 数组形式
- **源码收集**：通过 `compilation.hooks.afterOptimizeModules` 收集 `.js/.jsx/.ts/.tsx/.vue/.svelte` 原始源码
