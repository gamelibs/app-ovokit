import { NextResponse } from "next/server";
import { demoDefinitions } from "../../../../../../server/demos/registry";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const def = demoDefinitions.find((d) => d.id === id);
  if (!def) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = def.initSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return NextResponse.json({ error: "Invalid input", issues }, { status: 400 });
  }

  const result = await def.init(parsed.data as never);
  return NextResponse.json(result);
}

