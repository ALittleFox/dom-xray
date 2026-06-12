# @dom-xray/nextjs

## 2.0.1

### Patch Changes

- # default editor to 'vscode'

- Updated dependencies []:
  - @dom-xray/core@2.0.1
  - @dom-xray/overlay-ui@2.0.1

## 2.0.0

### Major Changes

- Next.js 16 + Turbopack + App Router 自动注入

  - 修复 Turbopack loader 崩溃（移除 as: "\*.js"）
  - 在 @dom-xray/core 的 Babel transform 中新增 scriptContent 选项，对 layout.tsx 自动在 <body> 内注入 <script
    dangerouslySetInnerHTML>，解决 RSC 模块副作用不执行的问题
  - 修复 Turbopack loader 配置传递（options: layoutLoaderOptions）

### Patch Changes

- Updated dependencies []:
  - @dom-xray/core@2.0.0
  - @dom-xray/overlay-ui@2.0.0

## 1.0.2

### Patch Changes

- 微调

- Updated dependencies []:
  - @dom-xray/core@1.0.2
  - @dom-xray/overlay-ui@1.0.2

## 1.0.1

### Patch Changes

- 调整 readme 和 package.json

- Updated dependencies []:
  - @dom-xray/core@1.0.1
  - @dom-xray/overlay-ui@1.0.1
