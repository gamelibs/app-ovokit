import { NextResponse } from "next/server";
import { demoDefinitions } from "../../../../../server/demos/registry";
import type { DemoDefinition } from "../../../../../server/demos/types";

type DemoMeta = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  initHelp: string;
  initExample: unknown;
  actionHelp: string;
  actionExample: unknown;
};

function metaFromDefinition(def: DemoDefinition<unknown, unknown, unknown, unknown>): DemoMeta {
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    tags: def.tags,
    initHelp: def.initHelp,
    initExample: def.initExample,
    actionHelp: def.actionHelp,
    actionExample: def.actionExample,
  };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const def = demoDefinitions.find((d) => d.id === id);
  if (!def) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(metaFromDefinition(def));
}

