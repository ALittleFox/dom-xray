export interface LayoutLoaderOptions {
  config: string;
  apiBase: string;
}

/**
 * Webpack / Turbopack loader that injects DOM XRay client init code
 * into layout.tsx / layout.jsx files.
 *
 * The injected code:
 * 1. Sets window.__DOM_XRAY_CONFIG__ and window.__DOM_XRAY_API__
 * 2. Dynamically loads /__dom-xray/client.js
 *
 * Only runs on the client (guarded by typeof window !== 'undefined').
 */
export default function layoutLoader(this: any, source: string) {
  const callback = this.async();
  const resourcePath = this.resourcePath || "";
  const options: LayoutLoaderOptions = this.getOptions?.() || {
    config: "{}",
    apiBase: "/__dom-xray",
  };

  // Only inject into layout.tsx / layout.jsx files
  const isLayout = /layout\.(tsx|jsx)$/.test(resourcePath);
  console.log("[dom-xray layout-loader] resourcePath:", resourcePath, "isLayout:", isLayout);
  if (!isLayout) {
    callback(null, source);
    return;
  }

  const initCode = `if(typeof window!=="undefined"&&!window.__DOM_XRAY_INIT__){window.__DOM_XRAY_INIT__=!0;window.__DOM_XRAY_CONFIG__=${options.config};window.__DOM_XRAY_API__=${JSON.stringify(options.apiBase)};var s=document.createElement("script");s.src="/__dom-xray/client.js";document.head.appendChild(s);}`;

  callback(null, initCode + "\n" + source);
}
