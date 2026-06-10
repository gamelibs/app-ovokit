"use client";

import Link from "next/link";

export function HandDrawnHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl sketch-border bg-paper/70 p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        {/* 左侧文字 */}
        <div className="min-w-0 space-y-4">
          <div className="relative">
            <h1 className="font-kalam text-3xl font-bold leading-tight text-ink sm:text-4xl">
              游戏玩法技术
              <br />
              实现分享站
            </h1>
            {/* 标题下划线高亮 */}
            <div className="mt-1 h-2 w-48 sketch-divider" />
          </div>

          <p className="text-sm leading-relaxed text-ink-light">
            探索游戏玩法设计与技术实现
            <br />
            拆解核心机制，学习实现思路
            <br />
            提升你的游戏开发能力
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/?all=1" className="sketch-button">
              浏览玩法
            </Link>
            <Link
              href="/about"
              className="sketch-button sketch-button-secondary"
            >
              阅读文章
            </Link>
          </div>
        </div>

        {/* 右侧手绘插图组合 */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-full max-w-[360px]">
            {/* 流程图主体 */}
            <img
              src="/svg/hero/flowchart.svg"
              alt=""
              className="w-full"
              loading="eager"
            />
            {/* 游戏手柄 - 左下 */}
            <img
              src="/svg/hero/gamepad.svg"
              alt=""
              className="absolute -left-4 bottom-0 w-20 -rotate-12"
              loading="eager"
            />
            {/* 便签 - 右上 */}
            <img
              src="/svg/hero/note.svg"
              alt=""
              className="absolute -right-2 -top-2 w-14 rotate-6"
              loading="eager"
            />
            {/* 太阳 - 右上远处 */}
            <img
              src="/svg/hero/sun.svg"
              alt=""
              className="absolute -right-6 top-4 w-10"
              loading="eager"
            />
            {/* 问号 - 右下 */}
            <img
              src="/svg/hero/question-mark.svg"
              alt=""
              className="absolute -right-4 bottom-8 w-10 rotate-12"
              loading="eager"
            />
            {/* 星星装饰 */}
            <img
              src="/svg/hero/sparkle.svg"
              alt=""
              className="absolute left-1/2 top-0 w-8 -translate-x-1/2"
              loading="eager"
            />
            {/* 硬币 - 底部 */}
            <img
              src="/svg/hero/coin.svg"
              alt=""
              className="absolute bottom-0 left-1/3 w-10 -rotate-6"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
