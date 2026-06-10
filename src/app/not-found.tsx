import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[60dvh] w-full max-w-2xl flex-col items-center justify-center px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-12 min-[360px]:px-4">
      <div className="text-center">
        <div className="font-kalam text-6xl font-bold text-ink sm:text-7xl">404</div>
        <div className="mt-2 font-kalam text-xl font-semibold text-ink-light">
          页面走丢了
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          这个地址不存在，或者内容已被移除。
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="sketch-button bg-highlight-yellow hover:bg-highlight-yellow/90 min-[360px]:px-6"
          >
            返回首页
          </Link>
          <Link
            href="/archetypes"
            className="sketch-button sketch-button-secondary min-[360px]:px-6"
          >
            浏览母型玩法
          </Link>
        </div>
      </div>

      {/* Decorative doodle */}
      <div className="mt-12 opacity-40">
        <svg
          width="200"
          height="120"
          viewBox="0 0 200 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto"
        >
          <path
            d="M20 100c10-30 30-50 60-50s50 20 60 50"
            stroke="#202020"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="70" cy="55" r="6" stroke="#202020" strokeWidth="2" fill="none" />
          <circle cx="130" cy="55" r="6" stroke="#202020" strokeWidth="2" fill="none" />
          <path
            d="M85 70c5 8 25 8 30 0"
            stroke="#202020"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M160 30c8-5 18-5 20 5s-5 15-15 10"
            stroke="#202020"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M30 40c-5-8-15-8-18 2s5 15 12 10"
            stroke="#202020"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    </main>
  );
}
