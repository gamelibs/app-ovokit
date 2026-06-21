import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site/config";
import { listPlaysWithMtime } from "@/lib/content/plays";
import { playArchetypeKeys } from "@/lib/archetypes/archetypes";
import { corePatternKeys } from "@/lib/patterns/patterns";
import { featureKeys } from "@/lib/features/features";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const now = new Date();

  const plays = await listPlaysWithMtime();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${origin}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${origin}/archetypes`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${origin}/patterns`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${origin}/features`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${origin}/favorites`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${origin}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${origin}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${origin}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const archetypes: MetadataRoute.Sitemap = playArchetypeKeys.map((key) => ({
    url: `${origin}/archetypes/${key}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const patterns: MetadataRoute.Sitemap = corePatternKeys.map((key) => ({
    url: `${origin}/patterns/${key}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const features: MetadataRoute.Sitemap = featureKeys.map((key) => ({
    url: `${origin}/features/${key}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const playRoutes: MetadataRoute.Sitemap = plays.map(({ meta, mtimeMs }) => ({
    url: `${origin}/play/${meta.slug}`,
    lastModified: new Date(mtimeMs),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...archetypes, ...patterns, ...features, ...playRoutes];
}
