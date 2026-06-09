import Link from "next/link";
import { siteConfig } from "@/lib/site/config";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-zinc-200 bg-white/60 px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 text-sm text-zinc-600 backdrop-blur dark:border-white/10 dark:bg-black/20 dark:text-zinc-300">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between min-[360px]:px-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/about" className="font-semibold text-zinc-700 hover:underline dark:text-zinc-200">
            关于
          </Link>
          <Link href="/contact" className="font-semibold text-zinc-700 hover:underline dark:text-zinc-200">
            联系
          </Link>
          <Link href="/privacy" className="font-semibold text-zinc-700 hover:underline dark:text-zinc-200">
            隐私政策
          </Link>
          <Link href="/terms" className="font-semibold text-zinc-700 hover:underline dark:text-zinc-200">
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
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            © {year} {siteConfig.name}
          </div>
        </div>
      </div>
    </footer>
  );
}
