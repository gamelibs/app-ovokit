import type { ArchetypePageModel } from "@/features/archetypes/pageModel";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { DemoEmbed } from "@/components/demos/DemoEmbed";
import { getDemoSrc } from "@/lib/demos/registry";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { fallbackCorePatternByKey, type CorePatternKey } from "@/lib/patterns/patterns";
import { featureKeyByName } from "@/lib/features/features";
import { localizeDifficulty } from "@/lib/content/play-tags";
import { useLocale, useTranslations } from "next-intl";

function ArchetypeImage({
  src,
  widthClass = "w-full",
  priority,
}: {
  src: string | null;
  widthClass?: string;
  priority?: boolean;
}) {
  if (!src) return null;

  // 容器锁死 4:3（= 蚀刻图固有比例）+ object-contain：信息图宁可留白，绝不被裁
  return (
    <div className={`mx-auto ${widthClass}`}>
      <div className="relative aspect-[4/3] w-full overflow-hidden sketch-card bg-ink/10">
        <Image src={src} alt="" fill sizes="(max-width: 1024px) 100vw, 960px" priority={priority} className="object-contain p-2" />
      </div>
    </div>
  );
}

function SectionShell({
  id,
  title,
  children,
  actions,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 sketch-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink font-kalam">{title}</h2>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ArchetypePage({
  model,
  images,
  embedded = false,
}: {
  model: ArchetypePageModel;
  images: {
    hero: string | null;
    interaction: string | null;
    rule: string | null;
    advanced: string | null;
  };
  embedded?: boolean;
}) {
  const t = useTranslations("pillar");
  const content = (
    <div className="space-y-4">
      <section className="rounded-3xl sketch-border bg-paper/70 p-4 shadow-sm">
        {/* 头部：左文右图（示意图是辅助，不再占满整屏） */}
        <div className="grid gap-3 sm:grid-cols-[1fr_minmax(220px,32%)] sm:items-start">
          <div className="min-w-0 order-1 sm:order-1">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold text-ink font-kalam">{model.title}</h1>
              <FavoriteButton
                type="archetype"
                itemKey={model.key}
                title={model.title}
                iconOnly
              />
            </div>
            <p className="mt-2 text-sm text-ink-light">{model.subtitle}</p>
            <div className="mt-3 grid gap-2 sketch-card p-3 text-sm text-ink-light">
              <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
                <div className="text-xs font-semibold text-ink-muted font-kalam">{t("playBehavior")}</div>
                <div className="font-medium">{model.title}</div>
              </div>
              <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
                <div className="text-xs font-semibold text-ink-muted font-kalam">{t("playFeatures")}</div>
                <div className="flex flex-wrap items-center gap-2">
                  {model.features.map((name) => {
                    const featureKey = featureKeyByName[name];
                    if (!featureKey) {
                      return (
                        <span key={name} className="text-ink-light">{name}</span>
                      );
                    }
                    return (
                      <Link
                        key={name}
                        href={`/features/${encodeURIComponent(featureKey)}`}
                        className="inline-flex items-center rounded-full sketch-border bg-highlight-green/20 px-2.5 py-0.5 text-xs text-ink hover:bg-highlight-green/45"
                      >
                        {name}
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
                <div className="text-xs font-semibold text-ink-muted font-kalam">{t("difficultyLabel")}</div>
                <div className="text-ink-light">{localizeDifficulty(model.difficulty, useLocale())}</div>
              </div>
            </div>
          </div>
          {/* 右侧：机制示意图缩略图 */}
          <div className="order-2 sm:order-2">
            <ArchetypeImage
              src={images.hero}
              priority
              widthClass="w-2/3 max-w-[220px] sm:w-full sm:max-w-none"
            />
          </div>
        </div>
        {/* 下方通栏：学习目标 + 所属核心循环（两栏紧凑，不参与上面的左右网格） */}
        <div className="mt-3 sketch-card grid gap-3 p-3 text-sm text-ink-light sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted font-kalam">
              {t("learningGoals")}
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {model.learningGoals.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          {model.patternKeys.length > 0 && (
            <div className="sm:min-w-[180px]">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted font-kalam">
                {t("belongsToPattern")}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {model.patternKeys.map((key) => {
                  const pattern = fallbackCorePatternByKey[key as CorePatternKey];
                  if (!pattern) return null;
                  return (
                    <Link
                      key={key}
                      href={`/patterns/${encodeURIComponent(key)}`}
                      className="inline-flex items-center gap-1.5 rounded-full sketch-border bg-highlight-green/20 px-2.5 py-1 text-sm font-medium text-ink hover:bg-highlight-green/45"
                    >
                      <span>{pattern.name}</span>
                      <span className="text-xs text-ink-light">{pattern.nameEn}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <nav className="flex items-center gap-2 overflow-x-auto py-1.5 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { id: "demo", label: t("navDemo") },
          { id: "breakdown", label: t("navBreakdown") },
          { id: "combos", label: t("navCombos") },
          { id: "advanced", label: t("navAdvanced") },
          ...(model.relatedPlays.length > 0 ? [{ id: "cases", label: t("navCases") }] : []),
        ].map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="inline-flex h-8 flex-none items-center justify-center rounded-full sketch-border bg-highlight-green/20 px-2.5 text-xs font-semibold text-ink hover:bg-highlight-green/45"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <SectionShell
        id="demo"
        title={`② ${t("demoInstant")}`}
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
          {/* 左：可玩 demo */}
          <div className="overflow-hidden sketch-border bg-paper sketch-shadow-sm p-3">
            <DemoEmbed
            title={`${model.title} Demo`}
            src={getDemoSrc("archetype", model.key) ?? ""}
            controls="toolbar"
            showRestart
            restartStrategy="postMessage"
            orientation="portrait"
          />
          </div>
          {/* 右：规则说明 */}
          <div className="sketch-border bg-paper sketch-shadow-sm-warm p-3 text-sm text-ink-light">
            <div className="text-xs font-semibold text-ink-muted font-kalam">{t("ruleHint")}</div>
            <div className="mt-1 font-medium">{model.demoRuleHint}</div>
          </div>
        </div>
      </SectionShell>

      <SectionShell id="breakdown" title={`③ ${t("breakdownArchetype")}`}>
        {/* 流程图在左（窄列），三张内容卡在右 */}
        <div className="grid gap-3 lg:grid-cols-[minmax(280px,34%)_1fr] lg:items-start">
          <ArchetypeImage
            src={images.rule}
            widthClass="w-full"
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3 min-w-0">
            <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
              <div className="text-xs font-semibold text-ink-muted font-kalam">3.1 {t("problemsSolved")}</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
                {model.problemsSolved.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
              <div className="text-xs font-semibold text-ink-muted font-kalam">3.2 {t("minimalRules")}</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
                {model.minimalRules.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
              <div className="text-xs font-semibold text-ink-muted font-kalam">3.3 {t("systemLoopOptional")}</div>
              <div className="mt-2 text-ink-light">{model.systemLoopHint}</div>
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell id="combos" title={`④ ${t("combosVariants")}`}>
        <div className="grid gap-3 lg:grid-cols-3">
          {model.combos.map((c) => (
            <div key={c.formula} className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
              <div className="font-semibold text-ink">{c.formula}</div>
              <div className="mt-1 text-ink-light">{c.effect}</div>
              {c.href ? (
                <Link href={c.href} className="mt-2 inline-flex text-xs font-semibold text-ink hover:underline">
                  {t("viewIntermediatePage")}
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </SectionShell>

      <section id="advanced" className="scroll-mt-24 sketch-card p-4 shadow-sm">
        <details className="group">
          <summary className="cursor-pointer list-none text-base font-semibold text-ink font-kalam">
            ⑤ {t("advancedAlgo")}
            <span className="ml-2 text-xs font-semibold text-ink-muted group-open:hidden font-kalam">{t("clickExpand")}</span>
          </summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_minmax(280px,34%)] lg:items-start">
            {/* 左：两张文字卡纵向堆叠 */}
            <div className="grid gap-3 content-start min-w-0">
              <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
                <div className="text-xs font-semibold text-ink-muted font-kalam">{t("designWarnings")}</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
                  {model.advancedWarnings.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
                <div className="text-xs font-semibold text-ink-muted font-kalam">{t("algoExamples")}</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
                  {model.advancedAlgoRefs.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
            {/* 右：图解 */}
            <ArchetypeImage
              src={images.advanced}
              widthClass="w-full"
            />
          </div>
        </details>
      </section>

      {model.relatedPlays.length > 0 && (
        <SectionShell id="cases" title={`⑥ ${t("relatedCases")}`}>
          <div className="grid gap-3 lg:grid-cols-3">
            {model.relatedPlays.map((p) => (
              <Link
                key={p.slug}
                href={`/play/${encodeURIComponent(p.slug)}`}
                className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm hover:bg-paper-warm"
              >
                <div className="font-semibold text-ink">{p.title}</div>
                {p.subtitle ? (
                  <div className="mt-1 line-clamp-3 text-ink-light">{p.subtitle}</div>
                ) : null}
              </Link>
            ))}
          </div>
        </SectionShell>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      {content}
    </main>
  );
}
