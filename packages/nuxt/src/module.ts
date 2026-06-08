import {
  defineNuxtModule,
  addVitePlugin,
  addServerHandler,
  addPlugin,
  createResolver,
} from "@nuxt/kit";
import { loadConfig } from "@dom-xray/core";
import type { PluginConfig } from "@dom-xray/core";
import { domSelectorVitePlugin } from "./vite-plugin.js";
import { startStandaloneServer } from "./standalone-server.js";

export interface DomXrayNuxtOptions extends PluginConfig {}

function createVueNodeTransform() {
  return (node: any, context: any) => {
    if (node.type === 1 && node.tagType === 0) {
      // Element node (not component)
      const line = node.loc?.start?.line || 1;
      const filePath = context.filename || "";
      node.props = node.props || [];
      node.props.push({
        type: 6,
        name: "data-source",
        value: {
          type: 2,
          content: `${filePath}:${line}`,
        },
        loc: node.loc,
      });
    }
  };
}

const module: any = defineNuxtModule<DomXrayNuxtOptions>({
  meta: {
    name: "@dom-xray/nuxt",
    configKey: "domXray",
  },
  defaults: {},
  async setup(options, nuxt) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[dom-xray] Nuxt module can only be used in development mode. Remove it from your production build configuration."
      );
    }

    const resolver = createResolver(import.meta.url);
    const fileConfig = loadConfig(nuxt.options.rootDir);
    const config: PluginConfig = { ...fileConfig, ...options };

    // 1. Inject data-source via Vue compiler nodeTransforms
    nuxt.options.vite = nuxt.options.vite || {};
    (nuxt.options.vite as any).vue = (nuxt.options.vite as any).vue || {};
    (nuxt.options.vite as any).vue.template =
      (nuxt.options.vite as any).vue.template || {};
    (nuxt.options.vite as any).vue.template.compilerOptions =
      (nuxt.options.vite as any).vue.template.compilerOptions || {};
    const existingTransforms =
      (nuxt.options.vite as any).vue.template.compilerOptions.nodeTransforms ||
      [];
    (nuxt.options.vite as any).vue.template.compilerOptions.nodeTransforms = [
      ...existingTransforms,
      createVueNodeTransform(),
    ];

    // 2. Add Vite plugin for source collection (JSX/Vue/Svelte)
    addVitePlugin(domSelectorVitePlugin(config) as any);

    // 3. Start standalone API server
    let serverPort = 0;
    let stopServer: (() => void) | undefined;

    try {
      const server = await startStandaloneServer(config);
      serverPort = server.port;
      stopServer = server.stop;
    } catch (e: any) {
      console.error("[dom-xray] Failed to start standalone server:", e.message);
    }

    // 4. Expose standalone server port to Nitro runtime
    nuxt.options.runtimeConfig.domSelectorStandalonePort = serverPort;

    // 5. Add Nitro proxy handler for all /__dom-xray/* routes
    addServerHandler({
      route: "/__dom-xray/**",
      handler: resolver.resolve("../runtime/server/proxy"),
    });

    // 6. Expose config to client via runtimeConfig
    nuxt.options.runtimeConfig.public.domXray = {
      title: config.title,
      hotkey: config.hotkey,
      clickSelector: config.clickSelector,
      targetFilePatterns: config.targetFilePatterns,
      editor: config.editor || "vscode",
      agentConfig: config.agentConfig,
    };

    // 7. Add client plugin to inject script tags
    addPlugin({
      src: resolver.resolve("../runtime/plugin"),
      mode: "client",
    });

    // Cleanup on Nuxt close
    nuxt.hooks.hook("close", () => {
      stopServer?.();
    });
  },
});

export default module;
