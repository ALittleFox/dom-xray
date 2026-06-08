import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { PluginConfig } from "@dom-xray/core";
import { loadConfig } from "@dom-xray/core";
import { startStandaloneServer } from "./standalone-server.js";

const require = createRequire(import.meta.url);

export interface DomXrayNextOptions extends PluginConfig {}

function resolveLoaderPath(): string {
  try {
    return require.resolve("@dom-xray/core/loader");
  } catch {
    // fallback: resolve from workspace
    return join(
      dirname(fileURLToPath(import.meta.url)),
      "../../core/dist/loader/index.js"
    );
  }
}

/**
 * Next.js plugin that integrates DOM XRay with both Turbopack and webpack.
 *
 * Usage in next.config.js / next.config.mjs:
 *
 * ```js
 * const { withDomSelector } = require("@dom-xray/nextjs");
 * module.exports = withDomSelector(
 *   { reactStrictMode: true },
 *   { title: "My App", editor: "vscode" }
 * );
 * ```
 */
export function withDomSelector(
  nextConfig: any = {},
  options?: DomXrayNextOptions
): any {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[dom-xray] Next.js plugin can only be used in development mode. Remove it from your production build configuration."
    );
  }

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
    agentConfig: config.agentConfig,
  });

  // Start standalone server eagerly in dev mode
  let serverPort = 0;
  let stopServer: (() => void) | undefined;

  const serverPromise = startStandaloneServer(domSelectorConfig).then(
    (server) => {
      serverPort = server.port;
      stopServer = server.stop;
      return server;
    }
  );

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
          __DOM_XRAY_CONFIG__: serializedConfig,
          __DOM_XRAY_API__: JSON.stringify("/__dom-xray"),
        })
      );

      return config;
    },

    // Inject env variables for runtime access (used by client script component)
    env: {
      ...nextConfig.env,
      DOM_XRAY_CONFIG: serializedConfig,
    },

    // Rewrite overlay-ui paths to standalone server
    async rewrites() {
      // Ensure server is started before rewrites are resolved
      await serverPromise;

      const userRewrites =
        typeof nextConfig.rewrites === "function"
          ? await nextConfig.rewrites()
          : nextConfig.rewrites || [];

      const domSelectorRewrites =
        serverPort > 0
          ? [
              {
                source: "/__dom-xray/:path*",
                destination: `http://localhost:${serverPort}/__dom-xray/:path*`,
              },
            ]
          : [];

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
