# @dom-xray/overlay-ui

## 2.0.0

### Major Changes

- Next.js 16 + Turbopack + App Router 自动注入

  - 修复 Turbopack loader 崩溃（移除 as: "\*.js"）
  - 在 @dom-xray/core 的 Babel transform 中新增 scriptContent 选项，对 layout.tsx 自动在 <body> 内注入 <script
    dangerouslySetInnerHTML>，解决 RSC 模块副作用不执行的问题
  - 修复 Turbopack loader 配置传递（options: layoutLoaderOptions）

## 1.0.2

### Patch Changes

- 微调

## 1.0.1

### Patch Changes

- 调整 readme 和 package.json
