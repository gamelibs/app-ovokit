export const siteConfig = {
  name: "OVOKIT",
  tagline: "游戏玩法技术分享",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
};

export function getSiteOrigin(): string {
  try {
    return new URL(siteConfig.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

