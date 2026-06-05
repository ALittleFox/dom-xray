import { withDomSelector } from "@dom-selector/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withDomSelector(nextConfig);