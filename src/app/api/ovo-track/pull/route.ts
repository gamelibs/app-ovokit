// OVO 站点访问统计 · 中心拉取端点（契约 §3：x-ovo-key 鉴权，recv_ts 升序增量）
import { PULL_KEY } from "@/lib/ovo-analytics/config.mjs";
import { pullEvents } from "@/lib/ovo-analytics/store.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (req.headers.get("x-ovo-key") !== PULL_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const sinceRaw = Number(url.searchParams.get("since") ?? 0);
  const since = Number.isFinite(sinceRaw) && sinceRaw > 0 ? Math.trunc(sinceRaw) : 0;
  const limitRaw = Number(url.searchParams.get("limit") ?? 5000);
  const limit = Math.min(
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.trunc(limitRaw) : 5000,
    10000
  );

  const events = pullEvents(since, limit);
  const latest = events.length > 0 ? events[events.length - 1].recv_ts : since;
  return Response.json({ events, latest });
}
