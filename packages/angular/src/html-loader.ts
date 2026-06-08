import { injectHtmlDataSource } from "./html-injector";

/**
 * Webpack loader for Angular HTML templates.
 * As a fallback to the fs monkey-patch, this loader handles .html files
 * that pass through webpack's regular loader chain.
 */
function htmlLoader(this: any, source: string) {
  const callback = this.async();
  const resourcePath = this.resourcePath;

  if (!resourcePath || resourcePath.includes("node_modules")) {
    callback(null, source);
    return;
  }
  if (!/\.html$/.test(resourcePath)) {
    callback(null, source);
    return;
  }

  try {
    const result = injectHtmlDataSource(source, resourcePath);
    if (result.changed) {
      console.log(`[dom-xray] injected: ${resourcePath}`);
    }
    callback(null, result.code);
  } catch {
    callback(null, source);
  }
}

export = htmlLoader;
