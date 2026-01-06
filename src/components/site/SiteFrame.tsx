import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { DisableNextDevIndicator } from "./DisableNextDevIndicator";
import { SyncFixedToScrollX } from "./SyncFixedToScrollX";
import { TopNav } from "./TopNav";
import { isModerator } from "@/lib/mod/auth";

export async function SiteFrame({ children }: { children: ReactNode }) {
  const moderator = await isModerator();
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <DisableNextDevIndicator />
      <SyncFixedToScrollX />
      <TopNav isModerator={moderator} />
      {children}
      <BottomNav isModerator={moderator} />
    </div>
  );
}
