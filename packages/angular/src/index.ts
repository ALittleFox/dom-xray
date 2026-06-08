import type { PluginConfig } from "./config";
import { injectHtmlDataSource } from "./html-injector";
import { collectSources, clearSourceCache } from "./source-collector";
import { mountMiddlewares } from "./client-server";
import { startDevServer } from "./dev-server";
import { createDomSelectorEsbuildPlugin } from "./esbuild-plugin";
import { patchFsReadFile } from "./patch-fs";

export {
  injectHtmlDataSource,
  collectSources,
  clearSourceCache,
  mountMiddlewares,
  startDevServer,
  createDomSelectorEsbuildPlugin,
  patchFsReadFile,
};

export interface DomSelectorAngularOptions extends PluginConfig {}

export function mountMiddlewaresOnApp(
  app: any,
  clientPath: string,
  getSources?: () => { filePath: string; source: string }[]
): void {
  mountMiddlewares(app, {
    clientPath: clientPath || "",
    getSources:
      getSources || (() => collectSources(process.cwd())),
  });
}

export default {
  injectHtmlDataSource,
  collectSources,
  clearSourceCache,
  mountMiddlewares,
  startDevServer,
  createDomSelectorEsbuildPlugin,
  patchFsReadFile,
  mountMiddlewaresOnApp,
};
