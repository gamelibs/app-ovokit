import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { DisableNextDevIndicator } from "./DisableNextDevIndicator";
import { SyncFixedToScrollX } from "./SyncFixedToScrollX";
import { TopNav } from "./TopNav";
import { isModerator } from "@/lib/mod/auth";
import { SiteFooter } from "./SiteFooter";
import { AppDialogProvider } from "@/components/ui/AppDialog";

export async function SiteFrame({ children }: { children: ReactNode }) {
  const moderator = await isModerator();
  return (
    <div className="min-h-dvh min-w-[360px] bg-paper text-ink">
      <DisableNextDevIndicator />
      <SyncFixedToScrollX />
      <TopNav isModerator={moderator} />
      <AppDialogProvider>{children}</AppDialogProvider>
      <SiteFooter />
      <BottomNav isModerator={moderator} />
    </div>
  );
}
