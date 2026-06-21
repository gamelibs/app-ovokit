import Link from "next/link";
import { listPatternSpecs } from "@/lib/patterns/spec";

function patternIcon(key: string) {
  return `/svg/icons/pattern-${key}.svg`;
}

export async function PatternQuickNav() {
  const specs = await listPatternSpecs();

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-kalam text-xl font-semibold text-ink">核心玩法原型</h2>
        <Link
          href="/patterns"
          className="font-kalam text-sm font-semibold text-ink-light hover:text-ink hover:underline"
        >
          查看全部 →
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {specs.map((spec) => (
          <Link
            key={spec.key}
            href={`/patterns/${spec.key}`}
            className="sketch-border bg-paper px-3 py-2 transition hover:bg-paper-warm"
          >
            <div className="flex items-center gap-2">
              <img
                src={patternIcon(spec.key)}
                alt={spec.name}
                className="h-6 w-6"
                loading="lazy"
              />
              <div>
                <div className="font-kalam text-sm font-semibold text-ink">{spec.name}</div>
                <div className="text-[10px] text-ink-muted">{spec.nameEn}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
