"use client";

import Link from "next/link";

const valuePoints = [
  "拆解经典游戏的玩法机制",
  "理解让游戏好玩的核心规则循环",
  "试玩最小可玩 Demo，感受设计差异",
  "从零学习一个玩法如何被实现"
];

export function HandDrawnHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl sketch-border bg-paper/70 p-3 shadow-sm sm:rounded-3xl sm:p-6">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-6">
        {/* 左侧文字 */}
        <div className="min-w-0 space-y-3 lg:space-y-5">
          <div className="relative">
            <h1 className="font-kalam text-xl font-bold leading-tight text-ink sm:text-3xl lg:text-4xl">
              探索游戏玩法
              <span className="hidden lg:inline">
                <br />
                发现设计乐趣
              </span>
              <span className="lg:hidden">，发现设计乐趣</span>
            </h1>
            {/* 标题下划线高亮 */}
            <div className="mt-1 h-1.5 w-32 sketch-divider sm:h-2 sm:w-48" />
          </div>

          <p className="hidden text-sm leading-relaxed text-ink-light lg:block">
            这是一个面向所有游戏爱好者的玩法分享站点。无论你是想弄懂游戏为什么好玩，还是想亲手设计一个玩法，都可以在这里找到灵感。
          </p>

          <p className="text-xs leading-relaxed text-ink-light lg:hidden">
            面向游戏爱好者的玩法分享站点，拆解机制、试玩 Demo、寻找设计灵感。
          </p>

          <ul className="hidden space-y-2 lg:block">
            {valuePoints.map((text) => (
              <li key={text} className="flex items-start gap-2 text-sm text-ink-light">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-highlight-yellow text-xs font-bold text-ink">
                  ✓
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <div className="hidden flex-wrap gap-3 lg:flex">
            <Link href="/patterns" className="sketch-button">
              浏览玩法
            </Link>
            <Link
              href="/about"
              className="sketch-button sketch-button-secondary"
            >
              了解更多
            </Link>
          </div>
        </div>

        {/* 右侧手绘插图组合 */}
        <div className="relative hidden items-center justify-center lg:flex">
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
