import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide Next.js Dev Tools indicator (bottom-left "N" button) in `pnpm dev`.
  devIndicators: false,

  // 产物型部署：构建输出 .next/standalone（含 traced 最小 node_modules + server.js），
  // 由 scripts/release.sh 组装发布到 deploy/gameslog.top 分支，服务器免构建直接 node server.js 运行。
  output: "standalone",

  // 图片全部为内容生产期预生成的 webp，运行时 /_next/image 优化是纯冗余；
  // 禁用后 next/image 直接输出原始 URL，产物也不再依赖 sharp 原生模块（与服务器平台彻底无关）。
  images: {
    unoptimized: true,
  },

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
