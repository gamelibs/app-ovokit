"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * 筛选条外壳（客户端）：chips 由服务端以 children 传入（RSC 组合模式），
 * 右端「级别定义」小开关，点击在筛选条下方内联展开/收起三级锚点说明卡（默认收起）。
 * 视觉层级为次级控件：整行小字（text-xs）、小 pill，避免与主浏览层级争抢注意力。
 */
export function ComplexityFilterBarShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("browseGroups");
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-0.5">
      <div className="flex items-center gap-1.5 text-xs">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="font-kalam inline-flex h-7 flex-none items-center justify-center rounded-full px-2.5 text-xs font-semibold text-ink-muted hover:bg-ink/5 hover:text-ink"
        >
          {t("legendToggle")} {open ? "▴" : "▾"}
        </button>
      </div>
      {open ? (
        <div className="mt-1 sketch-border bg-paper-warm/60 p-3">
          <ul className="space-y-1 text-sm leading-relaxed text-ink-light">
            <li>· {t("complexityBeginner")}</li>
            <li>· {t("complexityAdvanced")}</li>
            <li>· {t("complexityHardcore")}</li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
