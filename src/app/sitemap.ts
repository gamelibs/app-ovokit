import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site/config";
import { listPlaysWithMtime } from "@/lib/content/plays";
import { playArchetypeKeys } from "@/lib/archetypes/archetypes";
import { corePatternKeys } from "@/lib/patterns/patterns";
import { featureKeys } from "@/lib/features/features";
import { implementationTraitKeys } from "@/lib/implementation-traits/implementation-traits";

// 每条 URL 输出双语 hreflang：zh-CN 无前缀 + en /en 前缀（与 localePrefix: "as-needed" 对齐）
function withLangs(origin: string, path: string) {
  return {
    languages: {
      "zh-CN": `${origin}${path}`,
      en: `${origin}/en${path === "/" ? "" : path}`,
      "x-default": `${origin}${path}`,
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const now = new Date();

  const plays = await listPlaysWithMtime();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${origin}/`, lastModified: now, changeFrequency: "daily", priority: 1, alternates: withLangs(origin, "/") },
    { url: `${origin}/archetypes`, lastModified: now, changeFrequency: "weekly", priority: 0.7, alternates: withLangs(origin, "/archetypes") },
    { url: `${origin}/patterns`, lastModified: now, changeFrequency: "weekly", priority: 0.7, alternates: withLangs(origin, "/patterns") },
    { url: `${origin}/features`, lastModified: now, changeFrequency: "weekly", priority: 0.7, alternates: withLangs(origin, "/features") },
    { url: `${origin}/favorites`, lastModified: now, changeFrequency: "monthly", priority: 0.4, alternates: withLangs(origin, "/favorites") },
    { url: `${origin}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.4, alternates: withLangs(origin, "/about") },
    { url: `${origin}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4, alternates: withLangs(origin, "/contact") },
    { url: `${origin}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3, alternates: withLangs(origin, "/privacy") },
    { url: `${origin}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3, alternates: withLangs(origin, "/terms") },
  ];

  const archetypes: MetadataRoute.Sitemap = playArchetypeKeys.map((key) => ({
    url: `${origin}/archetypes/${key}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
    alternates: withLangs(origin, `/archetypes/${key}`),
  }));

  const patterns: MetadataRoute.Sitemap = corePatternKeys.map((key) => ({
    url: `${origin}/patterns/${key}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
    alternates: withLangs(origin, `/patterns/${key}`),
  }));

  const features: MetadataRoute.Sitemap = featureKeys.map((key) => ({
    url: `${origin}/features/${key}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
    alternates: withLangs(origin, `/features/${key}`),
  }));

  const implementationTraits: MetadataRoute.Sitemap = [
    { url: `${origin}/implementation-traits`, lastModified: now, changeFrequency: "weekly", priority: 0.7, alternates: withLangs(origin, "/implementation-traits") },
    ...implementationTraitKeys.map((key) => ({
      url: `${origin}/implementation-traits/${key}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: withLangs(origin, `/implementation-traits/${key}`),
    })),
  ];

  const playRoutes: MetadataRoute.Sitemap = plays.map(({ meta, mtimeMs }) => ({
    url: `${origin}/play/${meta.slug}`,
    lastModified: new Date(mtimeMs),
    changeFrequency: "monthly",
    priority: 0.8,
    alternates: withLangs(origin, `/play/${meta.slug}`),
  }));

  return [...staticRoutes, ...archetypes, ...patterns, ...features, ...implementationTraits, ...playRoutes];
}
