import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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

  async redirects() {
    // 2026-09-20 支柱内容分类重构（对齐 ovo_system taxonomy.v1.json）：
    // merge → merge-mechanic（与 pattern merge 消歧）；generation / state-machine 迁入
    // 工程实现特征层。zh 无前缀 + en /en 前缀两组路径都覆盖，301 永久重定向。
    const moves: Array<[string, string]> = [
      ["/features/merge", "/features/merge-mechanic"],
      ["/features/generation", "/implementation-traits/generation"],
      ["/features/state-machine", "/implementation-traits/state-machine"],
    ];
    return moves.flatMap(([source, destination]) => [
      { source, destination, statusCode: 301 },
      { source: `/en${source}`, destination: `/en${destination}`, statusCode: 301 },
    ]);
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

export default withNextIntl(nextConfig);
