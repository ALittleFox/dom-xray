import { injectJSXDataSource } from "./jsx.js";
import type { InjectResult, InjectJSXOptions } from "./jsx.js";

export type { InjectResult, InjectJSXOptions } from "./jsx.js";

/**
 * Entry point for injecting data-source attributes.
 * Dispatches to framework-specific transformers based on file extension.
 *
 * - `.jsx` / `.tsx` → JSX (React, SolidJS, Vue3 JSX) via Babel
 * - `.vue`          → Vue3 SFC `<template>` via @vue/compiler-sfc + htmlparser2
 * - `.svelte`       → Svelte via svelte/compiler + magic-string
 */
export async function injectDataSource(
  code: string,
  filePath: string,
  options?: InjectJSXOptions
): Promise<InjectResult> {
  if (filePath.endsWith(".vue")) {
    try {
      const { injectVueDataSource } = await import("./vue.js");
      return injectVueDataSource(code, filePath);
    } catch {
      return { code, map: null };
    }
  }

  if (filePath.endsWith(".svelte")) {
    try {
      const { injectSvelteDataSource } = await import("./svelte.js");
      return injectSvelteDataSource(code, filePath);
    } catch {
      return { code, map: null };
    }
  }

  // JSX / TSX — React, SolidJS, Vue3 JSX all share the same JSX AST
  return injectJSXDataSource(code, filePath, options);
}
