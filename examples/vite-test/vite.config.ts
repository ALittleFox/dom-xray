import { defineConfig } from "vite";
import domSelector from "@dom-selector/vite";

export default defineConfig({
  plugins: [
    domSelector({
      title: "Vite Test - DOM Selector",
      onSubmit: async (data) => {
        console.log("[vite-test] submitted:", data);
      },
    }),
  ],
});
