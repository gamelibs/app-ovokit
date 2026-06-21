export const siteConfig = {
  name: "OVO",
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
