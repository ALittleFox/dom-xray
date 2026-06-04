/// <reference types="nuxt" />
import fs from "node:fs";
import { resolveClientPath } from "@dom-selector/core";

export default defineEventHandler(() => {
  const clientPath = resolveClientPath();
  const source = fs.readFileSync(clientPath, "utf-8");
  return new Response(source, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-store",
    },
  });
});
