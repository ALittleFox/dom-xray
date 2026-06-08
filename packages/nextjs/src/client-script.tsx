"use client";

import Script from "next/script";

export interface DomSelectorScriptProps {
  /** Override the API base path. Default: current origin + "/__dom-xray" */
  apiBase?: string;
}

/**
 * React component that injects the DOM Selector client bundle and config.
 *
 * Add this to your root layout (App Router) or _app.tsx (Pages Router):
 *
 * ```tsx
 * import { DomSelectorScript } from "@dom-xray/nextjs/client";
 *
 * export default function Layout({ children }) {
 *   return (
 *     <html>
 *       <head>
 *         <DomSelectorScript />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * ```
 */
export function DomSelectorScript({ apiBase }: DomSelectorScriptProps) {
  const config = process.env.DOM_XRAY_CONFIG
    ? JSON.parse(process.env.DOM_XRAY_CONFIG)
    : {};

  const resolvedApiBase = apiBase || "/__dom-xray";

  const inlineScript = `
    window.__DOM_XRAY_CONFIG__ = ${JSON.stringify(config)};
    window.__DOM_XRAY_API__ = ${JSON.stringify(resolvedApiBase)};
  `;

  return (
    <>
      <Script
        id="dom-xray-config"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: inlineScript }}
      />
      <Script
        src="/__dom-xray/client.js"
        strategy="beforeInteractive"
      />
    </>
  );
}

export default DomSelectorScript;
