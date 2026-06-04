import {
  defineNuxtModule,
  addVitePlugin,
  addServerHandler,
  addPlugin,
  createResolver,
} from "@nuxt/kit";
import { loadConfig } from "@dom-selector/core";
import type { PluginConfig } from "@dom-selector/core";
import { domSelectorVitePlugin } from "./vite-plugin.js";

export interface DOMSelectorNuxtOptions extends PluginConfig {}

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

const module: any = defineNuxtModule<DOMSelectorNuxtOptions>({
  meta: {
    name: "@dom-selector/nuxt",
    configKey: "domSelector",
  },
  defaults: {},
  setup(options, nuxt) {
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
    // For Vue files, the load hook returns null to avoid blocking Vue plugin.
    // Source collection happens via transform + fs read.
    addVitePlugin(domSelectorVitePlugin(config) as any);

    // 3. Add Nitro API routes
    addServerHandler({
      route: "/__dom-selector/api/sources",
      handler: resolver.resolve("../runtime/server/sources.get"),
    });
    addServerHandler({
      route: "/__dom-selector/api/submit",
      handler: resolver.resolve("../runtime/server/submit.post"),
    });
    addServerHandler({
      route: "/__dom-selector/client.js",
      handler: resolver.resolve("../runtime/server/client.get"),
    });

    // 4. Expose config to client via runtimeConfig
    nuxt.options.runtimeConfig.public.domSelector = {
      title: config.title,
      hotkey: config.hotkey,
      clickSelector: config.clickSelector,
      targetFilePatterns: config.targetFilePatterns,
      editor: config.editor || "vscode",
    };

    // 5. Add client plugin to inject script tags
    addPlugin({
      src: resolver.resolve("../runtime/plugin"),
      mode: "client",
    });
  },
});

export default module;
