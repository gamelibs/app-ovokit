import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { type NextRequest, NextResponse } from "next/server";
import { isModerator } from "@/lib/mod/auth";
import { isFeatureKey } from "@/lib/features/features";
import { readFeatureSpec } from "@/lib/features/spec";

const comboSchema = z.object({
  formula: z.string(),
  effect: z.string(),
  href: z.string().optional(),
});

const featureSchema = z.object({
  key: z.string(),
  name: z.string().min(1),
  nameEn: z.string(),
  subtitle: z.string(),
  concept: z.string(),
  role: z.string(),
  significance: z.string(),
  filterTags: z.array(z.string()),
  cases: z.array(z.string()),
  problemsSolved: z.array(z.string()),
  learningGoals: z.array(z.string()),
  minimalRules: z.array(z.string()),
  combos: z.array(comboSchema),
  advancedWarnings: z.array(z.string()),
  advancedAlgoRefs: z.array(z.string()),
});

interface RouteContext {
  params: Promise<{ key: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { key } = await params;

  if (!(await isModerator())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFeatureKey(key)) {
    return NextResponse.json({ error: "Invalid feature key" }, { status: 400 });
  }

  const existing = await readFeatureSpec(key);
  if (!existing) {
    return NextResponse.json({ error: "Feature meta not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = featureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  if (parsed.data.key !== key) {
    return NextResponse.json({ error: "Key mismatch" }, { status: 400 });
  }

  const updated = { ...existing, ...parsed.data };
  const dir = path.join(process.cwd(), "content", "features", key);
  const metaPath = path.join(dir, "meta.json");

  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(metaPath, JSON.stringify(updated, null, 2) + "\n", "utf8");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Write failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
