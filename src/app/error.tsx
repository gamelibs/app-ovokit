"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60dvh] w-full max-w-2xl flex-col items-center justify-center px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-12 min-[360px]:px-4">
      <div className="text-center">
        <div className="font-kalam text-6xl font-bold text-ink sm:text-7xl">
          哎呀
        </div>
        <div className="mt-2 font-kalam text-xl font-semibold text-ink-light">
           something went wrong
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          页面遇到了一点小麻烦，可能是临时波动。
          <br />
          如果刷新后仍然出现，请通过联系页面反馈给我们。
        </p>

        {process.env.NODE_ENV === "development" && error?.message ? (
          <div className="mt-4 rounded-xl sketch-border bg-paper-warm p-3 text-left">
            <div className="text-[10px] font-semibold text-ink-muted uppercase tracking-wide">
              Error
            </div>
            <div className="mt-1 font-mono text-[11px] text-highlight-red">
              {error.message}
            </div>
            {error.digest ? (
              <div className="mt-1 font-mono text-[10px] text-ink-muted">
                digest: {error.digest}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="sketch-button bg-highlight-yellow hover:bg-highlight-yellow/90 min-[360px]:px-6"
          >
            再试一次
          </button>
          <Link
            href="/"
            className="sketch-button sketch-button-secondary min-[360px]:px-6"
          >
            返回首页
          </Link>
        </div>
      </div>

      {/* Decorative doodle — broken pencil */}
      <div className="mt-12 opacity-40">
        <svg
          width="200"
          height="120"
          viewBox="0 0 200 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto"
        >
          {/* pencil body */}
          <path
            d="M30 90 L140 40"
            stroke="#202020"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* pencil tip */}
          <path
            d="M30 90 L20 100 L25 105 L35 95"
            stroke="#202020"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="none"
          />
          {/* eraser */}
          <path
            d="M140 40 L150 35 L155 42 L145 47"
            stroke="#202020"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="none"
          />
          {/* crack line */}
          <path
            d="M80 65 L85 72 L90 68 L95 75"
            stroke="#ff8b8b"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* spark */}
          <path
            d="M100 60 L105 52 M100 60 L108 62 M100 60 L95 55"
            stroke="#ffda6a"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* question mark */}
          <text
            x="160"
            y="35"
            fontFamily="Kalam, cursive"
            fontSize="28"
            fill="#202020"
            opacity="0.6"
          >
            ?
          </text>
        </svg>
      </div>
    </main>
  );
}
