import { NextResponse } from "next/server";
import { incrementViews } from "@/lib/content/views";
import { rateLimitByIp, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { allowed, resetAt } = rateLimitByIp(req, RATE_LIMITS.view);
  if (!allowed) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    });
  }

  const { slug } = await params;
  if (!slug || typeof slug !== "string") {
    return new NextResponse("Invalid slug", { status: 400 });
  }
  const stats = await incrementViews(slug);
  return NextResponse.json(stats);
}
