import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { PluginConfig } from "@dom-selector/core";
import { loadConfig } from "@dom-selector/core";

const require = createRequire(import.meta.url);

export interface DOMSelectorNextOptions extends PluginConfig {}

function resolveLoaderPath(): string {
  try {
    return require.resolve("@dom-selector/core/loader");
  } catch {
    // fallback: resolve from workspace
    return join(
      dirname(fileURLToPath(import.meta.url)),
      "../../core/dist/loader.js"
    );
  }
}

/**
 * Next.js plugin that integrates DOM Selector with both Turbopack and webpack.
 *
 * Usage in next.config.js / next.config.mjs:
 *
 * ```js
 * const { withDomSelector } = require("@dom-selector/nextjs");
 * module.exports = withDomSelector(
 *   { reactStrictMode: true },
 *   { title: "My App", editor: "vscode" }
 * );
 * ```
 */
export function withDomSelector(
  nextConfig: any = {},
  options?: DOMSelectorNextOptions
): any {
  const domSelectorConfig = loadConfig(process.cwd());
  const config: PluginConfig = { ...domSelectorConfig, ...options };
  const loaderPath = resolveLoaderPath();

  // Serialize config for runtime injection
  const serializedConfig = JSON.stringify({
    title: config.title,
    hotkey: config.hotkey,
    clickSelector: config.clickSelector,
    targetFilePatterns: config.targetFilePatterns,
    editor: config.editor || "vscode",
  });

  return {
    ...nextConfig,

    // Inject Turbopack rules (webpack loader compatibility)
    turbopack: {
      ...nextConfig.turbopack,
      rules: {
        ...nextConfig.turbopack?.rules,
        "*.{jsx,tsx,vue,svelte}": {
          loaders: [
            {
              loader: loaderPath,
            },
          ],
        },
      },
    },

    // Also inject webpack rule for non-Turbopack mode
    webpack(config: any, ctx: any) {
      if (typeof nextConfig.webpack === "function") {
        config = nextConfig.webpack(config, ctx);
      }
      if (ctx.isServer) return config;

      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      config.module.rules.unshift({
        enforce: "pre",
        test: /\.(jsx|tsx|vue|svelte)$/,
        exclude: /node_modules/,
        use: [{ loader: loaderPath }],
      });

      // Define global constants for the client
      const { DefinePlugin } = require("webpack");
      config.plugins = config.plugins || [];
      config.plugins.push(
        new DefinePlugin({
          __DOM_SELECTOR_CONFIG__: serializedConfig,
          __DOM_SELECTOR_API__: JSON.stringify("/__dom-selector"),
        })
      );

      return config;
    },

    // Inject env variables for runtime access (used by API routes and client)
    env: {
      ...nextConfig.env,
      DOM_SELECTOR_CONFIG: serializedConfig,
    },

    // Rewrite overlay-ui client paths to Next.js API routes
    async rewrites() {
      const userRewrites =
        typeof nextConfig.rewrites === "function"
          ? await nextConfig.rewrites()
          : nextConfig.rewrites || [];

      const domSelectorRewrites = [
        {
          source: "/__dom-selector/client.js",
          destination: "/api/dom-selector/client",
        },
        {
          source: "/__dom-selector/api/:path*",
          destination: "/api/dom-selector/:path*",
        },
      ];

      if (Array.isArray(userRewrites)) {
        return [...domSelectorRewrites, ...userRewrites];
      }

      return {
        ...userRewrites,
        beforeFiles: [
          ...domSelectorRewrites,
          ...(userRewrites.beforeFiles || []),
        ],
      };
    },
  };
}

export default withDomSelector;
