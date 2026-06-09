import type { ArchetypePageModel } from "@/features/archetypes/pageModel";
import Link from "next/link";
import Image from "next/image";
import { DemoEmbed } from "@/components/demos/DemoEmbed";

function ArchetypeImage({
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
      <div
        className={`relative overflow-hidden rounded-2xl border border-zinc-200 bg-black/10 dark:border-white/10 dark:bg-black/30 ${heightClass}`}
      >
        <Image src={src} alt="" fill sizes="(max-width: 1024px) 100vw, 960px" priority={priority} className="object-cover" />
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
    <section id={id} className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
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
  const content = (
    <div className="space-y-4">
      <section className="rounded-3xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col gap-3">
          <ArchetypeImage
            src={images.hero}
            priority
          />
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">{model.title}</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{model.subtitle}</p>
          </div>
          <div className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-black/30 dark:text-zinc-200">
            <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">母型玩法</div>
              <div className="font-medium">{model.title}</div>
            </div>
            <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">玩法特征</div>
              <div className="text-zinc-600 dark:text-zinc-300">{model.features.join(" · ")}</div>
            </div>
            <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">难度层级</div>
              <div className="text-zinc-600 dark:text-zinc-300">{model.difficulty}</div>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-black/30 dark:text-zinc-200">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              学习目标
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {model.learningGoals.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

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
            className="inline-flex h-9 flex-none items-center justify-center rounded-full border border-zinc-200 bg-white px-3 font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <SectionShell
        id="demo"
        title="② 即时试玩 Demo"
      >
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-black/30 dark:text-zinc-200">
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">规则提示</div>
          <div className="mt-1 font-medium">{model.demoRuleHint}</div>
        </div>
        <div className="mt-3">
          <ArchetypeImage
            src={images.interaction}
            widthClass="w-full lg:w-[70%]"
            heightClass="h-[220px] sm:h-[260px] lg:h-[320px]"
          />
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-black/20">
          <DemoEmbed
            title={`${model.title} Demo`}
            src={`/embed/demos/archetype/${model.key}`}
            controls="toolbar"
            showRestart
            restartStrategy="postMessage"
          />
        </div>
        <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          约束：30 秒内自然理解；不做复杂 UI / 弹窗引导。
        </div>
      </SectionShell>

      <SectionShell id="breakdown" title="③ 母型玩法系统拆解">
        <ArchetypeImage
          src={images.rule}
          widthClass="w-full lg:w-[70%]"
          heightClass="h-[220px] sm:h-[260px] lg:h-[320px]"
        />
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-black/30">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">3.1 解决了什么问题？</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-200">
              {model.problemsSolved.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-black/30">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">3.2 最小规则集</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-200">
              {model.minimalRules.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-black/30">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">3.3 系统循环图（可选）</div>
            <div className="mt-2 text-zinc-700 dark:text-zinc-200">{model.systemLoopHint}</div>
          </div>
        </div>
      </SectionShell>

      <SectionShell id="combos" title="④ 常见组合与变体">
        <div className="grid gap-3 lg:grid-cols-3">
          {model.combos.map((c) => (
            <div key={c.formula} className="rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-black/30">
              <div className="font-semibold text-zinc-900 dark:text-zinc-50">{c.formula}</div>
              <div className="mt-1 text-zinc-600 dark:text-zinc-300">{c.effect}</div>
              {c.href ? (
                <Link href={c.href} className="mt-2 inline-flex text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300">
                  查看中级玩法页 →
                </Link>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">交互：卡片可点击；若有链接将跳转到对应的中级玩法页。</div>
      </SectionShell>

      <section id="advanced" className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <details className="group">
          <summary className="cursor-pointer list-none text-base font-semibold text-zinc-900 dark:text-zinc-50">
            ⑤ 高级设计与算法（默认折叠）
            <span className="ml-2 text-xs font-semibold text-zinc-500 group-open:hidden dark:text-zinc-400">点击展开</span>
          </summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <ArchetypeImage
                src={images.advanced}
                widthClass="w-full lg:w-[60%]"
                heightClass="h-[200px] sm:h-[240px] lg:h-[300px]"
              />
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-black/30">
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">设计警告</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-200">
                {model.advancedWarnings.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-black/30">
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">算法示例</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-200">
                {model.advancedAlgoRefs.map((t) => (
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
