import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { playDifficultyTier, type ContentLocale, type PlayMeta } from "@/lib/content/plays";
import { listArchetypeSpecs } from "@/lib/archetypes/spec";
import { listPatternSpecs } from "@/lib/patterns/spec";
import { listFeatureSpecs } from "@/lib/features/spec";
import { SketchIcon } from "@/components/sketch/SketchIcon";
import { PlayListItem } from "./PlayListItem";
import { LatestPlaysSection } from "./LatestPlaysSection";
import { DevToolsPanel } from "./DevToolsPanel";

function isSvg(src: string) {
  return src.endsWith(".svg");
}

/**
 * 默认落地页（无筛选时的「发现」界面）。
 * 信息架构：Hero（站点是什么）→ 三个内容域入口卡（真实数量）→ 可玩精选（真 demo）
 * → 新手必读（入门档）→ 最新发布。数据由 page.tsx 取好传入（plays），
 * 内容域数量在组件内读内容库 spec 列表，禁止写死。
 */
export async function DiscoverLanding({
  plays,
  canEdit,
}: {
  plays: PlayMeta[];
  canEdit: boolean;
}) {
  const locale = (await getLocale()) as ContentLocale;
  const t = await getTranslations("home");

  const [archetypeSpecs, patternSpecs, featureSpecs] = await Promise.all([
    listArchetypeSpecs(locale),
    listPatternSpecs(locale),
    listFeatureSpecs(locale),
  ]);

  const domains = [
    {
      key: "archetype",
      href: "/archetypes",
      icon: "Gamepad2",
      name: t("discoverDomainArchetypeName"),
      count: t("discoverDomainArchetypeCount", { count: archetypeSpecs.length }),
      question: t("discoverDomainArchetypeQuestion"),
    },
    {
      key: "pattern",
      href: "/patterns",
      icon: "Repeat",
      name: t("discoverDomainPatternName"),
      count: t("discoverDomainPatternCount", { count: patternSpecs.length }),
      question: t("discoverDomainPatternQuestion"),
    },
    {
      key: "feature",
      href: "/features",
      icon: "Sparkles",
      name: t("discoverDomainFeatureName"),
      count: t("discoverDomainFeatureCount", { count: featureSpecs.length }),
      question: t("discoverDomainFeatureQuestion"),
    },
  ] as const;

  const valuePoints = [
    t("discoverPoint1"),
    t("discoverPoint2"),
    t("discoverPoint3"),
  ];

  const playablePlays = plays.filter((p) => p.demo?.iframeSrc).slice(0, 4);
  const beginnerPlays = plays
    .filter((p) => playDifficultyTier(p.difficulty) === "beginner")
    .slice(0, 3);

  return (
    <>
      {/* Hero：一句话说清站点是什么 + 价值点 + 双 CTA（沿用 HandDrawnHero 布局骨架与插图资产） */}
      <section className="relative overflow-hidden rounded-2xl sketch-border bg-paper/70 p-3 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-6">
          <div className="min-w-0 space-y-3 lg:space-y-5">
            <div className="relative">
              <h1 className="font-kalam text-xl font-bold leading-tight text-ink sm:text-3xl lg:text-4xl">
                {t("discoverHeroTitle")}
              </h1>
              <div className="mt-1 h-1.5 w-32 sketch-divider sm:h-2 sm:w-48" />
            </div>

            <p className="text-xs leading-relaxed text-ink-light sm:text-sm">
              {t("discoverHeroSubtitle")}
            </p>

            <ul className="space-y-2">
              {valuePoints.map((text) => (
                <li key={text} className="flex items-start gap-2 text-xs text-ink-light sm:text-sm">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-highlight-yellow text-xs font-bold text-ink">
                    ✓
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              {/* 同页锚点：直达下方「可玩精选」，用原生 <a> 避免 locale 前缀干扰 hash */}
              <a href="#playable" className="sketch-button">
                {t("discoverCtaPlay")}
              </a>
              <Link
                href={{ pathname: "/", query: { all: "1" } }}
                className="sketch-button sketch-button-secondary"
              >
                {t("discoverCtaBrowse")}
              </Link>
            </div>
          </div>

          {/* 右侧手绘插图组合（资产复用自 HandDrawnHero） */}
          <div className="relative hidden items-center justify-center lg:flex">
            <div className="relative w-full max-w-[360px]">
              <img
                src="/hero/flowchart.webp"
                alt=""
                className="w-full"
                loading="eager"
              />
              <img
                src="/hero/gamepad.webp"
                alt=""
                className="absolute -left-4 bottom-0 w-20 -rotate-12"
                loading="eager"
              />
              <img
                src="/hero/note.webp"
                alt=""
                className="absolute -right-2 -top-2 w-14 rotate-6"
                loading="eager"
              />
              <img
                src="/hero/sun.webp"
                alt=""
                className="absolute -right-6 top-4 w-10"
                loading="eager"
              />
              <img
                src="/hero/question-mark.webp"
                alt=""
                className="absolute -right-4 bottom-8 w-10 rotate-12"
                loading="eager"
              />
              <img
                src="/hero/sparkle.webp"
                alt=""
                className="absolute left-1/2 top-0 w-8 -translate-x-1/2"
                loading="eager"
              />
              <img
                src="/hero/coin.webp"
                alt=""
                className="absolute bottom-0 left-1/3 w-10 -rotate-6"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 三个内容域入口卡：真实数量 + 「它能回答什么」 */}
      <section className="mt-8 space-y-4">
        <h2 className="font-kalam text-xl font-semibold text-ink">{t("discoverDomainsTitle")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {domains.map((d) => (
            <Link
              key={d.key}
              href={d.href}
              className="sketch-card block p-4 transition hover:bg-paper-warm"
            >
              <div className="flex items-center gap-2">
                <SketchIcon name={d.icon} size={20} />
                <span className="font-kalam text-base font-semibold text-ink">{d.name}</span>
              </div>
              <p className="mt-2 font-kalam text-sm font-semibold text-ink-light">{d.count}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{d.question}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 可玩精选：真实可玩案例（demo.iframeSrc 存在），右上「可试玩」徽标 */}
      {playablePlays.length > 0 ? (
        <section id="playable" className="mt-8 scroll-mt-24 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-kalam text-xl font-semibold text-ink">{t("discoverPlayableTitle")}</h2>
            <Link
              href={{ pathname: "/", query: { all: "1" } }}
              className="font-kalam text-sm font-semibold text-ink-light hover:text-ink hover:underline"
            >
              {t("discoverAllContent")} →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {playablePlays.map((p) => (
              <Link
                key={p.slug}
                href={`/play/${p.slug}`}
                className="sketch-card relative block overflow-hidden transition hover:scale-[1.02]"
              >
                <span className="absolute right-2 top-2 z-10 rounded-full bg-highlight-green px-2 py-0.5 text-[10px] font-semibold text-ink">
                  {t("discoverPlayableBadge")}
                </span>
                {p.cover?.src ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper-warm">
                    <Image
                      src={p.cover.src}
                      alt={p.title}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      unoptimized={isSvg(p.cover.src)}
                      className="object-contain p-4"
                      loading="lazy"
                    />
                  </div>
                ) : null}
                <div className="p-3 pt-2">
                  <h3 className="font-kalam line-clamp-2 text-sm font-semibold leading-snug">
                    {p.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-light">{p.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* 新手必读（入门档）+ 版主工具箱（骨架约定同原落地页） */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-kalam text-xl font-semibold text-ink">{t("discoverBeginnerTitle")}</h2>
            <Link
              href={{ pathname: "/", query: { all: "1", tier: "beginner" } }}
              className="font-kalam text-sm font-semibold text-ink-light hover:text-ink hover:underline"
            >
              {t("viewAll")} →
            </Link>
          </div>
          <div className="sketch-card p-3">
            <div className="divide-y divide-ink-light/10">
              {beginnerPlays.map((p) => (
                <PlayListItem key={p.slug} play={p} />
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          {canEdit ? <DevToolsPanel /> : null}
        </aside>
      </div>

      {/* 最新发布 */}
      <LatestPlaysSection />
    </>
  );
}
