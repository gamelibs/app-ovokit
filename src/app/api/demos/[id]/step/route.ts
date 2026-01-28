import { NextResponse } from "next/server";
import { demoDefinitions } from "../../../../../../server/demos/registry";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const def = demoDefinitions.find((d) => d.id === id);
  if (!def) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { state?: unknown; action?: unknown };
  const parsedAction = def.actionSchema.safeParse(body?.action);
  if (!parsedAction.success) {
    const issues = parsedAction.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return NextResponse.json({ error: "Invalid action", issues }, { status: 400 });
  }

  const result = await def.step({ state: body?.state as never, action: parsedAction.data as never });
  return NextResponse.json(result);
}

