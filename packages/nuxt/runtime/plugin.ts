/// <reference types="nuxt" />
import { useHead, useRuntimeConfig } from "#imports";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.domSelector as Record<string, any>;

  useHead({
    script: [
      {
        innerHTML: `window.__DOM_SELECTOR_CONFIG__ = ${JSON.stringify(config)}; window.__DOM_SELECTOR_API__ = "/__dom-selector";`,
        tagPosition: "head",
      },
      {
        src: "/__dom-selector/client.js",
        tagPosition: "head",
      },
    ],
  });
});
