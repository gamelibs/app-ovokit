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
      <header className="rounded-2xl sketch-border-thin bg-paper p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm leading-6 text-ink-light">
            {subtitle}
          </p>
        ) : null}
      </header>

      <section className="mt-4 rounded-2xl sketch-border-thin bg-paper p-5 shadow-sm">
        <div className="space-y-6 text-sm leading-6 text-ink-light">
          {children}
        </div>
      </section>
    </main>
  );
}
