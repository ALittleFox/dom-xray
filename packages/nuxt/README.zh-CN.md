# @dom-xray/nuxt

DOM XRay 的 Nuxt 3 模块适配器。通过 Vue 编译器 `nodeTransforms` 在编译阶段向模板元素注入 `data-source` 属性，同时提供 Nitro API 路由和客户端插件。

## 安装

```bash
npm i -D @dom-xray/nuxt
```

## 用法

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

或简写：

```ts
export default defineNuxtConfig({
  modules: ["@dom-xray/nuxt"],
  domXray: {
    editor: "cursor",
  },
});
```

## 配置

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

完整配置说明见根目录 [README.md](https://github.com/ALittleFox/dom-xray/blob/main/README.zh-CN.md)。

## 功能特性

- **开发模式专用**：生产构建会自动报错
- **Vue 编译器 `nodeTransforms`**：在模板编译阶段向元素注入 `data-source="filePath:line"`，零运行时开销
- **Vite 插件集成**：通过 `addVitePlugin` 集成源码收集和 JSX 转换
- **独立 API 服务器**：启动 Express 服务器提供 `/__dom-xray/api/*` 路由
- **Nitro 代理**：通过 `addServerHandler` 将所有 `/__dom-xray/**` 请求代理到独立服务器
- **客户端插件自动注入**：通过 `addPlugin` 在 `<head>` 中注入配置脚本和 `client.js`
