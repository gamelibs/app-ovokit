import { SiteFrame } from "@/components/site/SiteFrame";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <FavoritesProvider>
      <SiteFrame>{children}</SiteFrame>
    </FavoritesProvider>
  );
}
