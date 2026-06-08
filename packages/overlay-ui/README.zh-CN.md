# @dom-xray/overlay-ui

DOM XRay 浏览器覆盖层 UI，使用原生 Web Components + Shadow DOM 构建，实现样式隔离，不污染宿主页面。

本包通常作为下游适配器（`@dom-xray/vite`、`@dom-xray/webpack` 等）的内部依赖被自动安装，**一般不需要直接引入**。各适配器会自动将打包后的 `dist/client.js` 注入到开发页面的 `<head>` 中。

## 产物

| 文件 | 说明 |
| --- | --- |
| `dist/client.js` | 完整客户端 bundle（被各适配器注入页面） |

## 技术细节

- **Shadow DOM**：所有组件使用 `attachShadow({ mode: "open" })`，CSS 变量和样式完全隔离
- **自定义元素**：`dom-xray-overlay`、`dom-xray-header`、`dom-xray-body`、`dom-xray-source-panel`、`dom-xray-input-panel`、`dom-xray-footer`、`dom-xray-agent-panel`
- **零依赖**：不依赖 React、Vue 等框架，纯原生 Web API

## 本地开发

```bash
pnpm --filter @dom-xray/overlay-ui build
# 或
pnpm --filter @dom-xray/overlay-ui dev   # watch 模式
```

## 配置

客户端通过全局变量读取配置：

```html
<script>
  window.__DOM_XRAY_CONFIG__ = {
    title: "DOM XRay",
    hotkey: { mac: "option", win: "alt" },
    editor: "vscode",
    agentConfig: { type: "cursor", options: {} }
  };
  window.__DOM_XRAY_API__ = "/__dom-xray";
</script>
<script src="/@dom-xray/client.js"></script>
```

完整配置说明见根目录 [README.md](../../README.md)。
