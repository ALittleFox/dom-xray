import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import domSelector from "@dom-selector/vite";

export default defineConfig({
  plugins: [
    // domSelector must run *before* framework compilers so data-source
    // is injected into the raw source.
    domSelector({
      title: "Vite Svelte Test - DOM Selector",
      onSubmit: async (data) => {
        console.log("[vite-svelte-test] submitted:", data);
      },
    }),
    svelte(),
  ],
});
