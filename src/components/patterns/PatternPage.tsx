import type { CorePatternSpec } from "@/lib/patterns/spec";
import Image from "next/image";
import { DemoEmbed } from "@/components/demos/DemoEmbed";
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
}: {
  spec: CorePatternSpec;
  images: {
    hero: string | null;
    interaction: string | null;
    rule: string | null;
    advanced: string | null;
  };
  embedded?: boolean;
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
              <div className="text-xs font-semibold text-ink-muted font-kalam">核心循环</div>
              <div className="font-medium">{spec.loop}</div>
            </div>
            <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
              <div className="text-xs font-semibold text-ink-muted font-kalam">关键抽象</div>
              <div className="text-ink-light">{spec.abstractions.join(" · ")}</div>
            </div>
            <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
              <div className="text-xs font-semibold text-ink-muted font-kalam">经典案例</div>
              <div className="text-ink-light">{spec.cases.join(" · ")}</div>
            </div>
          </div>
        </div>
      </section>

      <SectionShell id="concept" title="① 概念、作用与意义">
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

      <SectionShell id="demo" title="② 即时试玩 Demo">
        <div className="sketch-border bg-paper sketch-shadow-sm-warm p-3 text-sm text-ink-light">
          <div className="text-xs font-semibold text-ink-muted font-kalam">规则提示</div>
          <div className="mt-1 font-medium">{spec.systemLoopHint}</div>
        </div>
        <div className="mt-3">
          <PatternImage
            src={images.interaction}
            widthClass="w-full lg:w-[70%]"
            heightClass="h-[220px] sm:h-[260px] lg:h-[320px]"
          />
        </div>
        <div className="mt-3 overflow-hidden sketch-border bg-paper sketch-shadow-sm p-3">
          <DemoEmbed
            title={`${spec.name} Demo`}
            src={`/embed/demos/pattern/${spec.key}`}
            controls="toolbar"
            showRestart
            restartStrategy="postMessage"
          />
        </div>
        <div className="mt-3 text-xs text-ink-muted">
          约束：30 秒内自然理解；不做复杂 UI / 弹窗引导。
        </div>
      </SectionShell>

      <SectionShell id="breakdown" title="③ 核心玩法系统拆解">
        <div className="mx-auto w-full lg:w-[90%]">
          <div className="text-xs font-semibold text-ink-muted font-kalam">核心循环流程图</div>
          <div className="relative mt-2 aspect-[800/300] w-full overflow-hidden sketch-border bg-paper">
            <Image
              src={`/patterns/${spec.key}/loop.svg`}
              alt="核心循环流程图"
              fill
              sizes="(max-width: 1024px) 100vw, 900px"
              className="object-contain"
            />
          </div>
        </div>
        <div className="mt-4">
          <PatternImage
            src={images.rule}
            widthClass="w-full lg:w-[70%]"
            heightClass="h-[220px] sm:h-[260px] lg:h-[320px]"
          />
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

      <SectionShell id="combos" title="④ 常见组合与变体">
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
            ⑤ 高级设计与算法（默认折叠）
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
