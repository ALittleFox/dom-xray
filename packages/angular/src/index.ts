import fs from "node:fs";
import path from "node:path";
import { injectHtmlDataSource } from "./html-injector";
import { collectSources, clearSourceCache } from "./source-collector";
import { mountMiddlewares } from "./client-server";
import { startDevServer } from "./dev-server";
import { createDomSelectorEsbuildPlugin } from "./esbuild-plugin";

export {
  injectHtmlDataSource,
  collectSources,
  clearSourceCache,
  mountMiddlewares,
  startDevServer,
  createDomSelectorEsbuildPlugin,
};

export interface DomSelectorAngularOptions {
  title?: string;
  editor?: string;
}

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
  mountMiddlewaresOnApp,
};
