import Link from "next/link";
import { listFeatureSpecs } from "@/lib/features/spec";

function featureIcon(key: string) {
  return `/svg/icons/feature-${key}.svg`;
}

export async function FeatureQuickNav() {
  const specs = await listFeatureSpecs();

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-kalam text-xl font-semibold text-ink">玩法特征</h2>
        <Link
          href="/features"
          className="font-kalam text-sm font-semibold text-ink-light hover:text-ink hover:underline"
        >
          查看全部 →
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {specs.map((spec) => (
          <Link
            key={spec.key}
            href={`/features/${spec.key}`}
            className="sketch-border bg-paper px-3 py-2 transition hover:bg-paper-warm"
          >
            <div className="flex items-center gap-2">
              <img
                src={featureIcon(spec.key)}
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
