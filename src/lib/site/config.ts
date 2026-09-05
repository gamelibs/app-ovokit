export const siteConfig = {
  name: "GamesLog",
  tagline: "游戏玩法技术分享",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:13100",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "h5gamelog@gmail.com",
};

export function getSiteOrigin(): string {
  try {
    return new URL(siteConfig.url).origin;
  } catch {
    return "http://localhost:13100";
  }
}

// 站点域名（如 gameslog.top），用于文案中引用；本地开发时为 localhost:13100
export function getSiteHost(): string {
  try {
    return new URL(siteConfig.url).host;
  } catch {
    return "localhost:13100";
  }
}
