import { SiteFrame } from "@/components/site/SiteFrame";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteFrame>{children}</SiteFrame>;
}

