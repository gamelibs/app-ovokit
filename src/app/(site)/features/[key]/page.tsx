import { isFeatureKey } from "@/lib/features/features";
import { notFound, redirect } from "next/navigation";

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ key?: string }>;
}) {
  const p = await params;
  const rawKey = p.key ?? "";
  if (!isFeatureKey(rawKey)) {
    notFound();
  }

  redirect(`/features?key=${encodeURIComponent(rawKey)}`);
}
