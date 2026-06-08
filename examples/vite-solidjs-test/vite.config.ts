import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import domXray from "@dom-xray/vite";

export default defineConfig({
  plugins: [
    // domXray must run *before* framework compilers so data-source
    // is injected into the raw source.
    domXray({
      title: "Vite SolidJS Test - DOM XRay",
      onSubmit: async (data) => {
        console.log("[vite-solidjs-test] submitted:", data);
      },
    }),
    solid(),
  ],
});
