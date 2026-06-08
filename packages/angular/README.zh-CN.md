# @dom-xray/angular

DOM XRay 的 Angular v17+ 集成包。通过 `fs.readFileSync` monkey-patch 拦截 Angular 编译器读取 HTML 模板的过程，在编译阶段注入 `data-source` 属性。

## 安装

```bash
npm i -D @dom-xray/angular
```

## 用法

### 1. 修改 `package.json` scripts

将 `ng` 命令替换为 `dom-xray-ng`：

```json
{
  "scripts": {
    "start": "dom-xray-ng serve --port 8089",
    "build": "ng build"
  }
}
```

### 2. 启动开发服务器

```bash
npm run start
```

`dom-xray-ng` 会自动完成：

- 拦截 Angular 编译器读取 `.html` 模板的过程，注入 `data-source`
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

## 高级用法

### 在自定义 dev server 中挂载中间件

如果你有自己的 Angular dev server 封装，可以手动挂载中间件：

```ts
import { mountMiddlewaresOnApp } from "@dom-xray/angular";

mountMiddlewaresOnApp(app, clientPath, () => collectSources(process.cwd()));
```

### esbuild 插件（实验性）

```ts
import { createDomSelectorEsbuildPlugin } from "@dom-xray/angular";

const plugin = createDomSelectorEsbuildPlugin();
```

### `fs.readFileSync` Patch（低层 API）

```ts
import { patchFsReadFile } from "@dom-xray/angular";

patchFsReadFile();
```

> **注意**：Angular 的编译器在 esbuild 处理 `.html` 文件之前就直接通过 `fs.readFileSync` 读取模板，因此传统的 esbuild `onLoad` 无法拦截。必须使用 `patchFsReadFile()` 在文件读取阶段注入属性。

## 配置

通过项目根目录 `dom-xray.config.json` 或 `package.json` 中的 `domXray` 字段配置。

完整配置说明见根目录 [README.md](https://github.com/ALittleFox/dom-xray/blob/main/README.zh-CN.md)。
