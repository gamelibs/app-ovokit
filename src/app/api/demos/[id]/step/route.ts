import { NextResponse } from "next/server";
import { demoDefinitions } from "../../../../../../server/demos/registry";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const def = demoDefinitions.find((d) => d.id === id);
  if (!def) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    state?: unknown;
    action?: unknown;
    lang?: unknown;
  };
  const parsedAction = def.actionSchema.safeParse(body?.action);
  if (!parsedAction.success) {
    const issues = parsedAction.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return NextResponse.json({ error: "Invalid action", issues }, { status: 400 });
  }

  // lang 覆盖：请求显式带 lang 时覆盖 state 内携带值（state.lang 由 init 写入）
  const state = body?.state;
  const lang = body?.lang === "zh" ? "zh" : body?.lang === "en" ? "en" : undefined;
  const effectiveState =
    lang && state && typeof state === "object" ? { ...(state as object), lang } : state;

  const result = await def.step({ state: effectiveState as never, action: parsedAction.data as never });
  return NextResponse.json(result);
}

