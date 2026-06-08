import { DomXrayPlugin } from "@dom-xray/webpack";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

let domSelectorLoaderPath;
let resolveClientPath;
try {
  domSelectorLoaderPath = require.resolve("@dom-xray/core/loader");
  const core = require("@dom-xray/core");
  resolveClientPath = core.resolveClientPath;
} catch {
  // fallback: resolve from workspace
  const base = join(dirname(fileURLToPath(import.meta.url)), "../../packages/core/dist");
  domSelectorLoaderPath = join(base, "loader.js");
  const core = require(base);
  resolveClientPath = core.resolveClientPath;
}

const domSelectorPlugin = new DomXrayPlugin({
  title: "Vue CLI Test - DOM Selector",
  onSubmit: async (data) => {
    console.log("[vue-cli-test] submitted:", data);
  },
});

export default {
  configureWebpack: {
    plugins: [domSelectorPlugin],
  },
  chainWebpack: (config) => {
    // Manually inject client entry for Vue CLI (its internal logic overwrites
    // compiler.options.entry after the plugin runs).
    const clientPath = resolveClientPath();
    config.entry("dom-xray-client").add(clientPath);

    // Inject pre-loader for .vue files before vue-loader
    config.module
      .rule("dom-xray")
      .before("vue")
      .test(/\.(jsx|tsx|vue|svelte)$/)
      .exclude.add(/node_modules/)
      .end()
      .enforce("pre")
      .use("dom-xray-loader")
      .loader(domSelectorLoaderPath);

    // Do not run babel-loader on the injected overlay-ui client bundle
    config.module
      .rule("js")
      .exclude.add(/overlay-ui[\/]dist[\/]client\.js$/)
      .end();
  },
  devServer: {
    port: 8086,
    setupMiddlewares(middlewares, devServer) {
      domSelectorPlugin.mountMiddlewares(devServer.app);
      return middlewares;
    },
  },
};
