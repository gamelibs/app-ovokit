import type { CorePatternSpec } from "@/lib/patterns/spec";
import Image from "next/image";
import Link from "next/link";
import { DemoEmbed } from "@/components/demos/DemoEmbed";
import { CodeBlock } from "@/components/plays/CodeBlock";

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
  heightClass = "h-[260px] sm:h-[320px] lg:h-[420px]",
  priority,
}: {
  src: string | null;
  widthClass?: string;
  heightClass?: string;
  priority?: boolean;
}) {
  if (!src) return null;

  return (
    <div className={`mx-auto ${widthClass}`}>
      <div className={`relative overflow-hidden sketch-card bg-ink/10 ${heightClass}`}>
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 960px"
          priority={priority}
          className="object-cover"
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
  const content = (
    <div className="space-y-4">
      <section className="rounded-3xl sketch-border bg-paper/70 p-4 shadow-sm">
        <div className="flex flex-col gap-3">
          <PatternImage src={images.hero} priority />
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold text-ink font-kalam">
                {spec.name}
                <span className="ml-2 text-base font-normal text-ink-light">{spec.nameEn}</span>
              </h1>
              <FavoriteButton
                type="pattern"
                itemKey={spec.key}
                title={spec.name}
                iconOnly
              />
            </div>
            <p className="mt-2 text-sm text-ink-light">{spec.subtitle}</p>
          </div>
          <div className="grid gap-2 sketch-card p-3 text-sm text-ink-light">
            <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
              <div className="text-xs font-semibold text-ink font-kalam">核心循环</div>
              <div className="font-semibold text-ink">{spec.loop}</div>
            </div>
            <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
              <div className="text-xs font-semibold text-ink font-kalam">关键抽象</div>
              <div className="font-semibold text-ink-light">{spec.abstractions.join(" · ")}</div>
            </div>
            <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
              <div className="text-xs font-semibold text-ink font-kalam">经典案例</div>
              <div className="flex flex-wrap gap-1.5">
                {spec.cases.map((c) => (
                  <Link
                    key={c}
                    href={{ pathname: "/", query: { q: c, all: "1" } }}
                    className="rounded-full sketch-border bg-paper px-2 py-0.5 text-xs text-ink-light hover:bg-paper-warm hover:text-ink"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionShell id="concept" title="概念、作用与意义">
        <div className="space-y-3 text-sm text-ink-light">
          <div>
            <div className="text-xs font-semibold text-ink-muted font-kalam">概念</div>
            <p className="mt-1 leading-relaxed">{spec.concept}</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-ink-muted font-kalam">作用</div>
            <p className="mt-1 leading-relaxed">{spec.role}</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-ink-muted font-kalam">意义</div>
            <p className="mt-1 leading-relaxed">{spec.significance}</p>
          </div>
        </div>
      </SectionShell>

      <nav className="flex items-center gap-2 overflow-x-auto py-1.5 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { id: "demo", label: "▶ 试玩 Demo" },
          { id: "breakdown", label: "系统拆解" },
          { id: "combos", label: "常见组合" },
          { id: "advanced", label: "高级设计 ▾" },
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

      <SectionShell id="demo" title="即时试玩 Demo">
        <div className="sketch-border bg-paper sketch-shadow-sm-warm p-3 text-sm text-ink-light">
          <div className="text-xs font-semibold text-ink-muted font-kalam">规则提示</div>
          <div className="mt-1 font-medium">{spec.systemLoopHint}</div>
        </div>
        <div className="mt-3 overflow-hidden sketch-border bg-paper sketch-shadow-sm p-3">
          <DemoEmbed
            title={`${spec.name} Demo`}
            src={`/embed/demos/pattern/${spec.key}`}
            controls="toolbar"
            showRestart
            restartStrategy="postMessage"
            orientation="portrait"
          />
        </div>
        <div className="mt-3 text-xs text-ink-muted">
          约束：30 秒内自然理解；不做复杂 UI / 弹窗引导。
          <span className="ml-1 text-ink-light">
            你在上方调的参数滑块，对应的正是下方「高级设计与算法」里那张图解的规则。
          </span>
        </div>
      </SectionShell>

      <SectionShell id="breakdown" title="核心玩法系统拆解">
        <div className="mx-auto w-full lg:w-[90%]">
          <div className="text-xs font-semibold text-ink-muted font-kalam">核心循环流程图</div>
          <div className="relative mt-2 aspect-[800/300] w-full overflow-hidden sketch-border bg-paper">
            <Image
              src={`/patterns/${spec.key}/loop.webp`}
              alt="核心循环流程图"
              fill
              sizes="(max-width: 1024px) 100vw, 900px"
              className="object-contain"
            />
          </div>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
            <div className="text-xs font-semibold text-ink-muted font-kalam">3.1 解决了什么问题？</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
              {spec.problemsSolved.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
            <div className="text-xs font-semibold text-ink-muted font-kalam">3.2 学习目标</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
              {spec.learningGoals.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
            <div className="text-xs font-semibold text-ink-muted font-kalam">3.3 最小规则集</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
              {spec.minimalRules.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </SectionShell>

      <SectionShell id="combos" title="常见组合与变体">
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
            高级设计与算法（默认折叠）
            <span className="ml-2 text-xs font-semibold text-ink-muted group-open:hidden font-kalam">点击展开</span>
          </summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <PatternImage
                src={images.advanced}
                widthClass="w-full lg:w-[60%]"
                heightClass="h-[200px] sm:h-[240px] lg:h-[300px]"
              />
            </div>
            <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
              <div className="text-xs font-semibold text-ink-muted font-kalam">设计警告</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
                {spec.advancedWarnings.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="sketch-border bg-paper sketch-shadow-sm p-3 text-sm">
              <div className="text-xs font-semibold text-ink-muted font-kalam">算法示例</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
                {spec.advancedAlgoRefs.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-2">
              <div className="mb-2 text-xs font-semibold text-ink-muted font-kalam">
                关键代码（{ADVANCED_CODE[spec.key]?.title ?? "核心算法"}）
              </div>
              <CodeBlock
                language="ts"
                code={ADVANCED_CODE[spec.key]?.code ?? ""}
                defaultExpanded
              />
            </div>
          </div>
        </details>
      </section>

      {relatedPlays.length > 0 ? (
          <SectionShell id="related" title="关联玩法文章">
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
