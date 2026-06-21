import { isCorePatternKey } from "@/lib/patterns/patterns";
import { notFound, redirect } from "next/navigation";

export default async function PatternDetailPage({
  params,
}: {
  params: Promise<{ key?: string }>;
}) {
  const p = await params;
  const rawKey = p.key ?? "";
  if (!isCorePatternKey(rawKey)) {
    notFound();
  }

  redirect(`/patterns?key=${encodeURIComponent(rawKey)}`);
}
