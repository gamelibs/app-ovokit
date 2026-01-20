import { isPlayArchetypeKey, type PlayArchetypeKey } from "@/lib/archetypes/archetypes";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";

export default async function ArchetypeDetailPage({
  params,
}: {
  params: Promise<{ key?: string }>;
}) {
  const p = await params;
  const rawKey = p.key ?? "";
  if (!isPlayArchetypeKey(rawKey)) {
    notFound();
  }
  const key = rawKey as PlayArchetypeKey;

  redirect(`/archetypes?key=${encodeURIComponent(key)}`);
}
