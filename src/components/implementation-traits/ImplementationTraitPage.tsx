import type { ImplementationTraitSpec } from "@/lib/implementation-traits/spec";
import Image from "next/image";
import { useTranslations } from "next-intl";

function FeatureImage({
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
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 960px"
          priority={priority}
          className="object-contain p-2"
        />
      </div>
    </div>
  );
}

function SectionShell({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 sketch-card p-4 shadow-sm">
      <h2 className="text-base font-semibold text-ink font-kalam">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ImplementationTraitPage({
  spec,
  images,
  embedded = false,
}: {
  spec: ImplementationTraitSpec;
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
        <div className="grid gap-3 sm:grid-cols-[1fr_minmax(220px,32%)] sm:items-start">
          <div className="order-1 sm:order-2">
            <FeatureImage src={images.hero} priority />
          </div>
          <div className="min-w-0 order-2 sm:order-1">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold text-ink font-kalam">
                {spec.name}
                {spec.nameEn !== spec.name ? (
                  <span className="ml-2 text-base font-normal text-ink-light">{spec.nameEn}</span>
                ) : null}
              </h1>
            </div>
            <p className="mt-2 text-sm text-ink-light">{spec.subtitle}</p>
          <div className="mt-3 grid gap-2 sketch-card p-3 text-sm text-ink-light">
            <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
              <div className="text-xs font-semibold text-ink-muted font-kalam">{t("filterTags")}</div>
              <div className="font-medium">{spec.filterTags.join(" · ")}</div>
            </div>
            <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
              <div className="text-xs font-semibold text-ink-muted font-kalam">{t("classicCases")}</div>
              <div className="text-ink-light">{spec.cases.join(" · ")}</div>
            </div>
          </div>
          </div>
        </div>
      </section>

      <SectionShell id="concept" title={`① ${t("conceptRoleSignificance")}`}>
        <div className="space-y-3 text-sm text-ink-light">
          <div>
            <div className="text-xs font-semibold text-ink-muted font-kalam">{t("concept")}</div>
            <p className="mt-1 leading-relaxed">{spec.concept}</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-ink-muted font-kalam">{t("role")}</div>
            <p className="mt-1 leading-relaxed">{spec.role}</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-ink-muted font-kalam">{t("significance")}</div>
            <p className="mt-1 leading-relaxed">{spec.significance}</p>
          </div>
        </div>
      </SectionShell>

      <nav className="flex items-center gap-2 overflow-x-auto py-1.5 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { id: "breakdown", label: t("navBreakdown") },
          { id: "combos", label: t("navCombos") },
          { id: "advanced", label: t("navAdvanced") },
        ].map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="inline-flex h-9 flex-none items-center justify-center rounded-full sketch-border bg-paper px-3 font-semibold text-ink-light hover:bg-paper-warm"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <SectionShell id="breakdown" title={`② ${t("breakdownFeature")}`}>
        <div className="grid gap-3 lg:grid-cols-[minmax(280px,34%)_1fr] lg:items-start">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3 min-w-0 order-2 lg:order-2">
          <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
            <div className="text-xs font-semibold text-ink-muted font-kalam">2.1 {t("problemsSolved")}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
              {spec.problemsSolved.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
            <div className="text-xs font-semibold text-ink-muted font-kalam">2.2 {t("learningGoals")}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
              {spec.learningGoals.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
            <div className="text-xs font-semibold text-ink-muted font-kalam">2.3 {t("minimalRules")}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
              {spec.minimalRules.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          </div>
          <div className="order-1 lg:order-1">
            <FeatureImage
              src={images.rule}
              widthClass="w-full"
            />
          </div>
        </div>
      </SectionShell>

      <SectionShell id="combos" title={`③ ${t("combosVariants")}`}>
        <div className="grid gap-3 lg:grid-cols-3">
          {spec.combos.map((c) => (
            <div key={c.formula} className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
              <div className="font-semibold text-ink">{c.formula}</div>
              <div className="mt-1 text-ink-light">{c.effect}</div>
            </div>
          ))}
        </div>
      </SectionShell>

      <section id="advanced" className="scroll-mt-24 sketch-card p-4 shadow-sm">
        <details className="group">
          <summary className="cursor-pointer list-none text-base font-semibold text-ink font-kalam">
            ④ {t("advancedAlgo")}
            <span className="ml-2 text-xs font-semibold text-ink-muted group-open:hidden font-kalam">{t("clickExpand")}</span>
          </summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_minmax(280px,34%)] lg:items-start">
            {/* 左：两张文字卡纵向堆叠 */}
            <div className="grid gap-3 content-start min-w-0">
              <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
                <div className="text-xs font-semibold text-ink-muted font-kalam">{t("designWarnings")}</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
                  {spec.advancedWarnings.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
                <div className="text-xs font-semibold text-ink-muted font-kalam">{t("algoExamples")}</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
                  {spec.advancedAlgoRefs.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
            {/* 右：图解 */}
            <FeatureImage
              src={images.advanced}
              widthClass="w-full"
            />
          </div>
        </details>
      </section>
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
