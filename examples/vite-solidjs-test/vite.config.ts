import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import domSelector from "@dom-selector/vite";

export default defineConfig({
  plugins: [
    // domSelector must run *before* framework compilers so data-source
    // is injected into the raw source.
    domSelector({
      title: "Vite SolidJS Test - DOM Selector",
      onSubmit: async (data) => {
        console.log("[vite-solidjs-test] submitted:", data);
      },
    }),
    solid(),
  ],
});
