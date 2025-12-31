import { playCategories } from "@/lib/content/plays";
import { TagPill } from "./TagPill";

export function CategoryTabs() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {playCategories.map((c, idx) => (
        <TagPill key={c.key} tone={idx === 0 ? "primary" : "neutral"}>
          {c.label}
        </TagPill>
      ))}
    </div>
  );
}
