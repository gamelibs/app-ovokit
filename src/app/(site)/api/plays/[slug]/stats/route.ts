import { NextResponse } from "next/server";
import { getPlayStats } from "@/lib/content/views";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug || typeof slug !== "string") {
    return new NextResponse("Invalid slug", { status: 400 });
  }
  const stats = await getPlayStats(slug);
  return NextResponse.json(stats);
}
