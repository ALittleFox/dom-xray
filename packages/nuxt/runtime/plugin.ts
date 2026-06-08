/// <reference types="nuxt" />
import { useHead, useRuntimeConfig } from "#imports";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.domXray as Record<string, any>;

  useHead({
    script: [
      {
        innerHTML: `window.__DOM_XRAY_CONFIG__ = ${JSON.stringify(config)}; window.__DOM_XRAY_API__ = "/__dom-xray";`,
        tagPosition: "head",
      },
      {
        src: "/__dom-xray/client.js",
        tagPosition: "head",
      },
    ],
  });
});
