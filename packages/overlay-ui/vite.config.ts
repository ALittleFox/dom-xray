import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/client.ts",
      formats: ["iife"],
      name: "DOMSelector",
      fileName: () => "client.js",
    },
    emptyOutDir: true,
    minify: true,
  },
});
