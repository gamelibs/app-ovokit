"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * 筛选条外壳（客户端）：chips 由服务端以 children 传入（RSC 组合模式），
 * 右端「级别定义」小开关，点击在筛选条下方内联展开/收起三级锚点说明卡（默认收起）。
 */
export function ComplexityFilterBarShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("browseGroups");
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1">
      <div className="flex items-center gap-2 min-[360px]:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[360px]:gap-3">
          {children}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="font-kalam inline-flex h-9 flex-none items-center justify-center rounded-full px-3 text-[13px] font-semibold text-ink-muted hover:bg-ink/5 hover:text-ink min-[360px]:h-10 min-[360px]:text-sm"
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
