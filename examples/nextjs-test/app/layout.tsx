import type { Metadata } from "next";
import { DomSelectorScript } from "@dom-xray/nextjs/client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js + Turbopack - DOM Selector",
  description: "Demo for DOM Selector with Next.js and Turbopack",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <DomSelectorScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
