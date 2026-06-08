# Changelog

所有重要变更均记录在此文件，格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

## [1.0.0] - 2026-06-08

### 🎉 初始发布（dom-xray 1.0.0）

发布 1.0.0 正式版本。

### Added

- **多构建工具支持**：Vite、Webpack 5、Rspack 2+、Next.js、Nuxt 3、Angular v17+
- **多框架源码注入**：React / SolidJS / Vue3（JSX 与 SFC `<template>`）/ Svelte / Angular HTML 模板
- **编译时精准定位**：通过 Babel AST、`@vue/compiler-sfc`、`svelte/compiler`、Vue `nodeTransforms` 和 `fs.readFileSync` patch 在编译阶段注入 `data-source` 属性
- **一键唤起弹窗**：支持自定义快捷键（默认 macOS `Option + 点击` / Windows `Alt + 点击`）
- **直接跳转编辑器**：支持 `Option + Command + 点击`（macOS）和 `Ctrl + Alt + 点击`（Windows/Linux）直接打开编辑器，无需弹窗
- **源码语法高亮**：弹窗内建 JSX / TSX 语法高亮
- **编辑器支持**：VSCode、Cursor、Zed、Trae 一键跳转
- **AI Agent 集成**：
  - Cursor Agent（支持自定义 model）
  - OpenCode Agent（支持本地 OpenCode Web 服务）
  - Claude Code Agent（支持 `permissionMode` 配置，默认 `acceptEdits`）
- **SSE 流式响应**：Agent 结果通过 Server-Sent Events 实时推送到前端
- **Web Components 弹窗**：基于 Shadow DOM，样式完全隔离，不污染宿主页面
- **独立 API 服务器**：Next.js / Nuxt / Angular 通过独立 Express 服务器提供 API，避免与框架 dev server 冲突
- **Rspack dev-server v2 兼容**：适配新版 `middlewares` 数组 API
- **Turbopack 兼容**：Next.js 插件通过 `turbopack.rules` 注入 loader 兼容规则

### Changed

- **全面重命名**：包名从 `@dom-selector/*` 更改为 `@dom-xray/*`
  - 全局常量：`__DOM_SELECTOR_*__` → `__DOM_XRAY_*__`
  - API 路径：`/__dom-selector/` → `/__dom-xray/`
  - Web Components 标签：`dom-selector-*` → `dom-xray-*`
  - 类名：`DOMSelector*` → `DomXray*`
  - 配置文件：`dom-selector.config.json` → `dom-xray.config.json`
- **目录结构整理**：`core` 包按功能分类为 `config/`、`server/`、`transform/`、`agent/`、`loader/` 等子目录
- **默认编辑器**：从 `vscode` 调整为 `cursor`

### Fixed

- 修复 Rspack dev-server v2 `app.get is not a function` 错误
- 修复 Next.js Turbopack loader 路径缓存问题
- 修复 `domSelectorLoaderPath` 指向错误文件的问题
- 修复 Angular patch 加载 ESM core 模块时的 CommonJS 兼容问题
- 修复 OpenCode 事件流中未按 `sessionID` 过滤导致消息串扰的问题
- 修复 Agent SSE 流结束后 `done` 覆盖 `error` 状态的问题

### Docs

- 新增各子包独立 README（`@dom-xray/core`、`@dom-xray/vite`、`@dom-xray/webpack`、`@dom-xray/rspack`、`@dom-xray/nextjs`、`@dom-xray/nuxt`、`@dom-xray/angular`、`@dom-xray/overlay-ui`）
- 完善 Claude Agent `permissionMode` 配置说明
- 添加 OpenCode Agent 使用注意事项（需先启动 `opencode web`）

[1.0.0]: https://github.com/anthropics/dom-xray/releases/tag/v1.0.0
