import { fileURLToPath } from "node:url";
import { injectDataSource } from "../transform/index.js";

export const domSelectorLoaderPath = fileURLToPath(
  new URL("./loader.js", import.meta.url)
);

/**
 * Webpack / Rspack loader that injects data-source attributes.
 * Supports JSX/TSX (React, SolidJS, Vue3 JSX), Vue3 SFC, and Svelte.
 */
export default function domSelectorLoader(this: any, source: string) {
  const callback = this.async();
  const resourcePath = this.resourcePath;

  if (!resourcePath || /node_modules/.test(resourcePath)) {
    callback(null, source);
    return;
  }

  if (!/\.(jsx|tsx|vue|svelte)$/.test(resourcePath)) {
    callback(null, source);
    return;
  }

  injectDataSource(source, resourcePath)
    .then((res) => {
      callback(null, res.code, res.map ?? undefined);
    })
    .catch(() => {
      callback(null, source);
    });
}
