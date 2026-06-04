import { DOMSelectorPlugin } from "@dom-selector/webpack";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
let domSelectorLoaderPath;
try {
  domSelectorLoaderPath = require.resolve("@dom-selector/core/loader");
} catch {
  // fallback: resolve from workspace
  domSelectorLoaderPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../packages/core/dist/loader.js"
  );
}

export default {
  configureWebpack: {
    plugins: [
      new DOMSelectorPlugin({
        title: "Vue CLI Test - DOM Selector",
        onSubmit: async (data) => {
          console.log("[vue-cli-test] submitted:", data);
        },
      }),
    ],
  },
  chainWebpack: (config) => {
    // Inject pre-loader for .vue files before vue-loader
    config.module
      .rule("dom-selector")
      .before("vue")
      .test(/\.(jsx|tsx|vue|svelte)$/)
      .exclude.add(/node_modules/)
      .end()
      .enforce("pre")
      .use("dom-selector-loader")
      .loader(domSelectorLoaderPath);

    // Do not run babel-loader on the injected overlay-ui client bundle
    config.module
      .rule("js")
      .exclude.add(/overlay-ui[\/]dist[\/]client\.js$/)
      .end();
  },
  devServer: {
    port: 8086,
  },
};
