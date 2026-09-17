import { NextResponse } from "next/server";
import { incrementLikes } from "@/lib/content/views";
import { rateLimitByIp, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { allowed, resetAt } = rateLimitByIp(req, RATE_LIMITS.like);
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
  const stats = await incrementLikes(slug);
  return NextResponse.json(stats);
}
