import { NextResponse } from "next/server";
import { incrementViews } from "@/lib/content/views";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug || typeof slug !== "string") {
    return new NextResponse("Invalid slug", { status: 400 });
  }
  const stats = await incrementViews(slug);
  return NextResponse.json(stats);
}
