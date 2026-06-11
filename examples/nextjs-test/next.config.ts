import { withDomSelector } from "@dom-xray/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
    // cacheComponents: true,
    reactCompiler: false,
    turbopack: {
      rules: {
        '*.svg': {
          loaders: [
            {
              loader: '@svgr/webpack',
              options: {
                icon: true,
              },
            },
          ],
          as: '*.js',
        },
      },
    },
    // 你的其他 Next.js 配置（如 reactStrictMode、images 等）
    reactStrictMode: true,
    // 信任代理（生产环境建议指定具体代理 IP，如 ['192.168.1.100']，避免伪造头攻击）
    /* 保留末尾斜杠 */
    // trailingSlash: true,
    skipTrailingSlashRedirect: true,
    /* config options here */
    allowedDevOrigins: [
    ],
    crossOrigin: 'anonymous',
    images: {
      unoptimized: true,
      remotePatterns: [
        // Allow https images from any host; tighten this if you know exact domains
        { protocol: 'https', hostname: '**' },
        { protocol: 'http', hostname: '**' },
      ],
    },
    async headers() {
      return [
        {
          source: '/:path*\\.html', // 匹配所有 html 文件
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
            },
            { key: 'Pragma', value: 'no-cache' },
            { key: 'Expires', value: '0' },
          ],
        },
      ];
    },
    async rewrites() {

      return [

      ];
    },
  };

export default withDomSelector(nextConfig);
