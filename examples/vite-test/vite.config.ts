import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import domSelector from "@dom-selector/vite";

export default defineConfig({
  plugins: [
    react(),
    domSelector({
      title: "Vite Test - DOM Selector",
      onSubmit: async (data) => {
        console.log("[vite-test] submitted:", data);
      },
    }),
  ],
});
