import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide Next.js Dev Tools indicator (bottom-left "N" button) in `pnpm dev`.
  devIndicators: false,

  async headers() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const isProductionHost =
      siteUrl.startsWith("https://") &&
      !siteUrl.includes("localhost") &&
      !siteUrl.includes("127.0.0.1");

    // 只在生产 HTTPS 域名启用 HSTS，避免本地 http://localhost 被浏览器强制重定向到 https。
    if (!isProductionHost) {
      return [];
    }

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            // 初始建议 1 小时（3600），验证无误后改为 1 年（31536000）并提交 preload 列表。
            value: "max-age=3600; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
