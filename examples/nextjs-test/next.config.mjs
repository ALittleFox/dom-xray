import { withDomSelector } from "@dom-selector/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withDomSelector(nextConfig, {
  title: "Next.js + Turbopack Test",
  editor: "vscode",
  onSubmit: async (data) => {
    console.log("[nextjs-test] submitted:", data);
  },
});