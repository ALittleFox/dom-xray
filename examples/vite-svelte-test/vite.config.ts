import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import domXray from "@dom-xray/vite";

export default defineConfig({
  plugins: [
    // domXray must run *before* framework compilers so data-source
    // is injected into the raw source.
    domXray({
      title: "Vite Svelte Test - DOM XRay",
      onSubmit: async (data) => {
        console.log("[vite-svelte-test] submitted:", data);
      },
    }),
    svelte(),
  ],
});
