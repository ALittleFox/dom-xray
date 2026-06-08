import { withDomSelector } from "@dom-xray/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withDomSelector(nextConfig);