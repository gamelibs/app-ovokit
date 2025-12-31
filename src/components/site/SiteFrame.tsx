import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";

export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <TopNav />
      {children}
      <BottomNav />
    </div>
  );
}

