import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site/config";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();
  const host = (() => {
    try {
      return new URL(origin).host;
    } catch {
      return undefined;
    }
  })();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/mod/", "/embed/", "/referencecase/"],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host,
  };
}
