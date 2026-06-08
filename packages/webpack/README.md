# @dom-xray/webpack

DOM XRay 的 Webpack 5 插件适配器。在编译阶段向 JSX/TSX、Vue SFC、Svelte 文件注入 `data-source` 属性，支持 Vue CLI 项目。

## 安装

```bash
npm i -D @dom-xray/webpack
```

## 用法

### webpack.config.js

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

### Vue CLI（vue.config.mjs）

```js
import { DomXrayPlugin } from "@dom-xray/webpack";

export default {
  configureWebpack: {
    plugins: [new DomXrayPlugin()],
  },
};
```

如果需要在 `chainWebpack` 中使用 loader：

```js
import { domSelectorLoaderPath } from "@dom-xray/core";

export default {
  chainWebpack(config) {
    config.module
      .rule("dom-xray")
      .before("vue")
      .test(/\.(jsx|tsx|vue|svelte)$/)
      .use("dom-xray-loader")
      .loader(domSelectorLoaderPath);
  },
};
```

## 配置

```ts
interface DomXrayWebpackOptions {
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
- **自动注入客户端 entry**：将 `@dom-xray/overlay-ui/dist/client.js` 注入到 webpack entry 中
- **DefinePlugin 注入全局常量**：`__DOM_XRAY_CONFIG__`、`__DOM_XRAY_API__`
- **devServer 中间件自动挂载**：通过 `setupMiddlewares` 注册 `/__dom-xray/api/*` 路由
- **手动挂载中间件（Vue CLI 场景）**：

```js
const plugin = new DomXrayPlugin();
plugin.mountMiddlewares(app);
```
