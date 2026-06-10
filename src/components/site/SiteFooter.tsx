import Link from "next/link";
import { siteConfig } from "@/lib/site/config";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="hidden lg:block border-t border-ink-light/20 bg-paper/60 px-3 pb-6 pt-6 text-sm text-ink-light backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between min-[360px]:px-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/about" className="font-kalam font-semibold text-ink-light hover:underline">
            关于
          </Link>
          <Link href="/contact" className="font-kalam font-semibold text-ink-light hover:underline">
            联系
          </Link>
          <Link href="/privacy" className="font-kalam font-semibold text-ink-light hover:underline">
            隐私政策
          </Link>
          <Link href="/terms" className="font-kalam font-semibold text-ink-light hover:underline">
            使用条款
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {siteConfig.contactEmail ? (
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="hover:underline"
            >
              {siteConfig.contactEmail}
            </a>
          ) : null}
          <div className="text-xs text-ink-muted">
            © {year} {siteConfig.name}
          </div>
        </div>
      </div>
    </footer>
  );
}
