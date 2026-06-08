# @dom-xray/core

DOM XRay 核心工具库，提供配置加载、多框架源码转换（Babel / Vue / Svelte）、开发服务器辅助工具和 AI Agent 中间件。

本包通常作为下游适配器（`@dom-xray/vite`、`@dom-xray/webpack` 等）的内部依赖被自动安装，**一般不需要直接引入**。

## 安装

```bash
npm i -D @dom-xray/core
```

## API

### `loadConfig(cwd?)`

加载 `dom-xray.config.json` 或 `package.json` 中的 `domXray` 字段。

```ts
import { loadConfig } from "@dom-xray/core";

const config = loadConfig(process.cwd());
```

### `resolveClientPath()`

解析 `@dom-xray/overlay-ui/dist/client.js` 的绝对路径，供各适配器在开发服务器中提供客户端脚本。

```ts
import { resolveClientPath } from "@dom-xray/core";

const clientPath = resolveClientPath();
```

### `injectDataSource(code, filePath)`

在源码编译阶段向元素注入 `data-source` 属性。

- `.jsx` / `.tsx` → Babel AST 转换
- `.vue` → `@vue/compiler-sfc` + `htmlparser2`
- `.svelte` → `svelte/compiler` + `magic-string`

```ts
import { injectDataSource } from "@dom-xray/core";

const result = await injectDataSource(sourceCode, "/path/to/App.tsx");
// result.code  转换后的代码
// result.map   可选 source map
```

### `createAgentMiddleware(config)`

创建 AI Agent SSE 流式接口的中间件，支持 Cursor、OpenCode、Claude 三种 Agent 类型。

```ts
import { createAgentMiddleware } from "@dom-xray/core";

const middleware = createAgentMiddleware(config);
// 挂载到 /__dom-xray/api/agent
```

### Loader

`domSelectorLoaderPath` 指向核心 loader 的入口，供 Webpack / Rspack / Next.js 在 `enforce: "pre"` 阶段注入 `data-source`。

```js
{
  enforce: "pre",
  test: /\.(jsx|tsx|vue|svelte)$/,
  use: [{ loader: require("@dom-xray/core").domSelectorLoaderPath }],
}
```

## 类型定义

```ts
import type { PluginConfig, SourceInfo, InspectTarget } from "@dom-xray/core";
```

完整类型定义见 [`src/types.ts`](./src/types.ts)。
