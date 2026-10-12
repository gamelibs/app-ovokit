// OVO 站点访问统计 · 采集端点（契约 §2：校验/UA 过滤/限流/服务端补全，响应恒 204 或 4xx）
import { createHash } from "node:crypto";
import { SITE } from "@/lib/ovo-analytics/config.mjs";
import { insertEvent } from "@/lib/ovo-analytics/store.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENT_RE = /^[a-z][a-z0-9_.]{0,39}$/;
const SLUG_RE = /^[a-z0-9-]{0,80}$/;
const BOT_RE = /bot|crawler|spider|curl|wget|python|headless|lighthouse|pagespeed/i;
const MAX_BODY = 2048;
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

// 模块级滑动窗口限流：10 次/分钟/IP（ip_hash 键），超限 204 丢弃（失败开放）
const rateBuckets = new Map<string, number[]>();

function limited(key: string) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  const hits: number[] = bucket ? bucket.filter((t: number) => now - t < RATE_WINDOW_MS) : [];
  if (hits.length >= RATE_LIMIT) {
    rateBuckets.set(key, hits);
    return true;
  }
  hits.push(now);
  rateBuckets.set(key, hits);
  if (rateBuckets.size > 10000) {
    for (const [k, v] of rateBuckets) {
      if (v.every((t: number) => now - t >= RATE_WINDOW_MS)) rateBuckets.delete(k);
    }
  }
  return false;
}

function ipHash(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  const ip = (xff ? xff.split(",")[0].trim() : "") || req.headers.get("x-real-ip") || "direct";
  return createHash("sha256").update(ip).digest("hex");
}

const noContent = () => new Response(null, { status: 204 });

export async function POST(req: Request) {
  const ua = (req.headers.get("user-agent") || "").slice(0, 200);
  if (BOT_RE.test(ua)) return noContent();

  const raw = await req.text();
  if (raw.length > MAX_BODY) return new Response("Payload too large", { status: 413 });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  if (!body || typeof body !== "object") return new Response("Invalid body", { status: 400 });
  if (body.site !== SITE) return new Response("Site mismatch", { status: 400 });

  const path = typeof body.path === "string" ? body.path : "";
  if (!path.startsWith("/") || path.length > 200) return new Response("Invalid path", { status: 400 });

  const event = typeof body.event === "string" ? body.event : "";
  if (!EVENT_RE.test(event)) return new Response("Invalid event", { status: 400 });

  const sid = typeof body.sid === "string" ? body.sid : "";
  if (!sid || sid.length > 64) return new Response("Invalid sid", { status: 400 });

  let gameSlug: string | null = null;
  if (body.gameSlug != null) {
    gameSlug = String(body.gameSlug);
    if (!SLUG_RE.test(gameSlug)) return new Response("Invalid gameSlug", { status: 400 });
    if (gameSlug === "") gameSlug = null;
  }

  const hash = ipHash(req);
  if (limited(hash)) return noContent();

  const ref = body.ref != null ? String(body.ref).slice(0, 100) : null;
  const utm = body.utm && typeof body.utm === "object" ? (body.utm as Record<string, unknown>) : null;
  const utmVal = (k: string) => (utm && typeof utm[k] === "string" ? String(utm[k]).slice(0, 100) : null);
  const vp = body.vp != null ? String(body.vp).slice(0, 20) : null;
  const ts = Number.isFinite(body.ts) ? Math.trunc(Number(body.ts)) : Date.now();

  insertEvent({
    ts,
    recv_ts: Date.now(),
    sid,
    event,
    path,
    game_slug: gameSlug,
    ref,
    utm_source: utmVal("source"),
    utm_medium: utmVal("medium"),
    utm_campaign: utmVal("campaign"),
    vp,
    ua,
    ip_hash: hash,
  });

  return noContent();
}
