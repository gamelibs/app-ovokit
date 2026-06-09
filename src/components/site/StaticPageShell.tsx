import type { ReactNode } from "react";

export function StaticPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-4xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {subtitle}
          </p>
        ) : null}
      </header>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="space-y-6 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
          {children}
        </div>
      </section>
    </main>
  );
}
