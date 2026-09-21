import type { CorePatternSpec } from "@/lib/patterns/spec";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { DemoEmbed } from "@/components/demos/DemoEmbed";
import { getDemoSrc } from "@/lib/demos/registry";
import { CodeBlock } from "@/components/plays/CodeBlock";
import { useTranslations } from "next-intl";

/** ⑤ 区关键代码：每循环一段真实可读的算法实现（与该区文字互为注解） */
const ADVANCED_CODE: Record<string, { title: string; code: string }> = {
  action: {
    title: "固定时间步 + 难度递进",
    code: `// 固定步长驱动，压力随时间爬升（速度阶梯 × 密度斜坡）
const STEP = 1000 / 60;
const ramp = 1 + Math.min(t / 18, 2.2);      // 每 18s +1，封顶 3.2x
spawnT -= dt;
if (spawnT <= 0) {
  spawnT = (0.7 / density) / ramp;            // 间隔变短 = 密度变大
  bullets.push({ vy: baseSpeed * (0.7 + ramp * 0.3) });
}`,
  },
  spatial: {
    title: "可解性搜索（DFS 剪枝）",
    code: `function solvable(board, depth = 0): boolean {
  if (isGoal(board)) return true;
  if (depth > MAX_DEPTH) return false;
  for (const move of legalMoves(board)) {
    const next = apply(board, move);
    if (seen.has(hash(next))) continue;      // 剪枝：访问过就跳过
    seen.add(hash(next));
    if (solvable(next, depth + 1)) return true;
  }
  return false;
}`,
  },
  merge: {
    title: "成本/产出指数曲线",
    code: `// 剪刀差的来源：成本增速必须 < 产出爽感，但不能 > 太多
const cost = (n: number) => Math.floor(base * Math.pow(growth, n));   // 1.15^n
const output = (n: number) => Math.pow(2, n);                          // 指数产出
// 调参原则：growth 每 +0.05，后期时长翻倍——先算再调`,
  },
  management: {
    title: "生产 tick 与库存上限",
    code: `function tick(dt: number) {
  const rate = producers.reduce((s, p) => s + p.count * p.out, 0);
  goods = Math.min(goodsCap, goods + rate * dt);   // 上限防通胀
}
function sellAll() {
  coins += goods;                                   // 货物 → 金币
  goods = 0;
}`,
  },
  strategy: {
    title: "克制系数伤害公式",
    code: `const COUNTER = { A: { B: 1.5, C: 0.5 }, B: { C: 1.5, A: 0.5 }, C: { A: 1.5, B: 0.5 } };
function damage(attacker: Unit, defender: Unit): number {
  const k = COUNTER[attacker.type]?.[defender.type] ?? 1.0;
  return Math.max(1, Math.floor(attacker.atk * k - defender.def));
}`,
  },
  narrative: {
    title: "状态旗标 → 结局判定",
    code: `const ENDINGS: [string, (f: Flags) => boolean][] = [
  ["篝火夜谈", (f) => f.kind && f.courage],          // 优先级从高到低
  ["一碗热汤", (f) => !!f.kind],
  ["灯下的影子", (f) => f.courage && !f.warm],
  ["平安无事", (f) => !!f.cautious],
];
const ending = ENDINGS.find(([, cond]) => cond(flags))?.[0] ?? "雨停";`,
  },
};
import { FavoriteButton } from "@/components/favorites/FavoriteButton";

function PatternImage({
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

export function PatternPage({
  spec,
  images,
  embedded = false,
  relatedPlays = [],
}: {
  spec: CorePatternSpec;
  images: {
    hero: string | null;
    interaction: string | null;
    rule: string | null;
    advanced: string | null;
  };
  embedded?: boolean;
  relatedPlays?: { slug: string; title: string; subtitle: string }[];
}) {
  const t = useTranslations("pillar");
  const content = (
    <div className="space-y-4">
      <section className="rounded-3xl sketch-border bg-paper/70 p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-[1fr_minmax(220px,32%)] sm:items-start">
          <div className="order-2 sm:order-2">
            <PatternImage src={images.hero} priority widthClass="w-2/3 max-w-[220px] sm:w-full sm:max-w-none" />
          </div>
          <div className="min-w-0 order-1 sm:order-1">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold text-ink font-kalam">
                {spec.name}
                {spec.nameEn !== spec.name ? (
                  <span className="ml-2 text-base font-normal text-ink-light">{spec.nameEn}</span>
                ) : null}
              </h1>
              <FavoriteButton
                type="pattern"
                itemKey={spec.key}
                title={spec.name}
                iconOnly
              />
            </div>
            <p className="mt-2 text-sm text-ink-light">{spec.subtitle}</p>
          <div className="mt-3 grid gap-2 sketch-card p-3 text-sm text-ink-light">
            <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
              <div className="text-xs font-semibold text-ink font-kalam">{t("coreLoop")}</div>
              <div className="font-semibold text-ink">{spec.loop}</div>
            </div>
            <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
              <div className="text-xs font-semibold text-ink font-kalam">{t("keyAbstractions")}</div>
              <div className="font-semibold text-ink-light">{spec.abstractions.join(" · ")}</div>
            </div>
            <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
              <div className="text-xs font-semibold text-ink font-kalam">{t("classicCases")}</div>
              <div className="flex flex-wrap gap-1.5">
                {spec.cases.map((c) => (
                  <Link
                    key={c}
                    href={{ pathname: "/", query: { q: c, all: "1" } }}
                    className="rounded-full sketch-border bg-highlight-green/20 px-1.5 py-0.5 text-[11px] text-ink hover:bg-highlight-green/45"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      <nav className="flex items-center gap-2 overflow-x-auto py-1.5 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { id: "demo", label: t("navDemo") },
          { id: "breakdown", label: t("navBreakdown") },
          { id: "combos", label: t("navCombos") },
          { id: "advanced", label: t("navAdvanced") },
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

      <SectionShell id="demo" title={t("demoInstant")}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
          {/* 左：可玩 demo */}
          <div className="overflow-hidden sketch-border bg-paper sketch-shadow-sm p-3">
            <DemoEmbed
            title={`${spec.name} Demo`}
            src={getDemoSrc("pattern", spec.key) ?? ""}
            controls="toolbar"
            showRestart
            restartStrategy="postMessage"
            orientation="portrait"
          />
          </div>
          {/* 右：规则说明 */}
          <div className="sketch-border bg-paper sketch-shadow-sm-warm p-3 text-sm text-ink-light">
            <div className="text-xs font-semibold text-ink-muted font-kalam">{t("ruleHint")}</div>
            <div className="mt-1 font-medium">{spec.systemLoopHint}</div>
            <div className="mt-3 space-y-3 border-t border-ink-faint pt-3">
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
          </div>
        </div>
      </SectionShell>

      <SectionShell id="breakdown" title={t("breakdownPattern")}>
        {/* 左：流程图；右：三张卡纵向堆叠 */}
        <div className="grid gap-3 lg:grid-cols-[1fr_minmax(0,380px)] lg:items-start">
          <div>
            <div className="text-xs font-semibold text-ink-muted font-kalam">{t("loopFlowchart")}</div>
            <div className="relative mt-2 aspect-[800/300] w-full overflow-hidden sketch-border bg-paper">
              <Image
                src={`/patterns/${spec.key}/loop.webp`}
                alt={t("loopFlowchart")}
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-contain"
              />
            </div>
          </div>
          <div className="grid gap-3 content-start">
          <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
            <div className="text-xs font-semibold text-ink-muted font-kalam">3.1 {t("problemsSolved")}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
              {spec.problemsSolved.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
            <div className="text-xs font-semibold text-ink-muted font-kalam">3.2 {t("learningGoals")}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
              {spec.learningGoals.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
            <div className="text-xs font-semibold text-ink-muted font-kalam">3.3 {t("minimalRules")}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
              {spec.minimalRules.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell id="combos" title={t("combosVariants")}>
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
            {t("advancedAlgo")}
            <span className="ml-2 text-xs font-semibold text-ink-muted group-open:hidden font-kalam">{t("clickExpand")}</span>
          </summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_minmax(280px,34%)] lg:items-start">
            {/* 左：文字卡 + 关键代码纵向堆叠 */}
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
              <div>
                <div className="mb-2 text-xs font-semibold text-ink-muted font-kalam">
                  {t("keyCode")}（{ADVANCED_CODE[spec.key]?.title ?? t("coreAlgo")}）
                </div>
                <CodeBlock
                  language="ts"
                  code={ADVANCED_CODE[spec.key]?.code ?? ""}
                  defaultExpanded
                />
              </div>
            </div>
            {/* 右：图解 */}
            <PatternImage
              src={images.advanced}
              widthClass="w-full"
            />
          </div>
        </details>
      </section>

      {relatedPlays.length > 0 ? (
          <SectionShell id="related" title={t("relatedPlays")}>
            <div className="grid gap-2 sm:grid-cols-2">
              {relatedPlays.map((p) => (
                <Link
                  key={p.slug}
                  href={`/play/${p.slug}`}
                  className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm hover:bg-paper-warm"
                >
                  <div className="font-semibold text-ink">{p.title}</div>
                  <div className="mt-1 line-clamp-1 text-xs text-ink-muted">{p.subtitle}</div>
                </Link>
              ))}
            </div>
          </SectionShell>
      ) : null}
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
