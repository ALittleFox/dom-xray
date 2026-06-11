import { injectDataSource } from "@dom-xray/core";

export interface TurbopackLoaderOptions {
  config: string;
  apiBase: string;
}

/**
 * Combined Turbopack loader for Next.js:
 * 1. Injects data-source attributes into JSX elements (via @dom-xray/core)
 * 2. Injects DOM XRay client init code into layout.tsx / layout.jsx
 *
 * Note: Next.js Turbopack currently does not reliably invoke webpack loaders
 * for .tsx/.jsx files. This loader is kept for forward compatibility.
 */
export default function turbopackLoader(this: any, source: string) {
  const callback = this.async();
  const resourcePath = this.resourcePath || "";
  const rawOptions = this.getOptions?.() || {};
  const options: TurbopackLoaderOptions = {
    config: "{}",
    apiBase: "/__dom-xray",
    ...rawOptions,
  };

  // Skip node_modules
  if (/node_modules/.test(resourcePath)) {
    callback(null, source);
    return;
  }

  // Only process jsx/tsx/vue/svelte files
  if (!/\.(jsx|tsx|vue|svelte)$/.test(resourcePath)) {
    callback(null, source);
    return;
  }

  const isLayout = /layout\.(tsx|jsx)$/.test(resourcePath);
  const initCode = isLayout
    ? `if(!window.__DOM_XRAY_INIT__){window.__DOM_XRAY_INIT__=!0;window.__DOM_XRAY_CONFIG__=${options.config};window.__DOM_XRAY_API__=${JSON.stringify(options.apiBase)};var s=document.createElement("script");s.src="/__dom-xray/client.js";document.head.appendChild(s);}`
    : undefined;

  injectDataSource(source, resourcePath, { scriptContent: initCode })
    .then((res) => {
      callback(null, res.code, res.map ?? undefined);
    })
    .catch(() => {
      callback(null, source);
    });
}
