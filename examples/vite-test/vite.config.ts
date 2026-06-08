import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import domXray from "@dom-xray/vite";

export default defineConfig({
  plugins: [
    react(),
    domXray({
      title: "Vite Test - DOM XRay",
      onSubmit: async (data) => {
        console.log("[vite-test] submitted:", data);
      },
    }),
  ],
});
