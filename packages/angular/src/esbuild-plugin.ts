import type { Plugin } from "esbuild";
import type { PluginConfig } from "./config";

export interface DomSelectorAngularOptions extends PluginConfig {}

/**
 * Create an esbuild plugin that sets define constants for the DOM Selector client.
 *
 * Note: Angular's compiler reads HTML templates directly via fs.readFile
 * before esbuild processes them, so onLoad for .html files will NOT intercept
 * Angular templates. Use `patchFsReadFile()` from `@dom-selector/angular/patch`
 * for compile-time data-source injection.
 */
export function createDomSelectorEsbuildPlugin(
  options?: DomSelectorAngularOptions
): Plugin {
  const opts = options || {};
  const apiUrl = process.env.DOM_SELECTOR_API_URL || "/__dom-selector";

  return {
    name: "dom-selector-angular",
    setup(build) {
      build.initialOptions.define = build.initialOptions.define || {};
      build.initialOptions.define["__DOM_SELECTOR_API__"] =
        JSON.stringify(apiUrl);
      build.initialOptions.define["__DOM_SELECTOR_CONFIG__"] = JSON.stringify({
        title: opts.title,
        hotkey: opts.hotkey,
        clickSelector: opts.clickSelector,
        targetFilePatterns: opts.targetFilePatterns,
        editor: opts.editor || "vscode",
        agentConfig: opts.agentConfig,
      });
    },
  };
}
