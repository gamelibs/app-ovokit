// OVO 站点访问统计 · 采集端本地存储（契约 §4 schema，node:sqlite + WAL，禁止 better-sqlite3）
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { SITE } from "./config.mjs";

let db = null;

function getDb() {
  if (db) return db;
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  db = new DatabaseSync(path.join(dataDir, "ovo-analytics.sqlite"));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site TEXT NOT NULL,
    ts INTEGER NOT NULL,
    recv_ts INTEGER NOT NULL,
    sid TEXT NOT NULL,
    event TEXT NOT NULL,
    path TEXT NOT NULL,
    game_slug TEXT,
    ref TEXT,
    utm_source TEXT, utm_medium TEXT, utm_campaign TEXT,
    vp TEXT, ua TEXT, ip_hash TEXT
  );`);
  db.exec("CREATE INDEX IF NOT EXISTS idx_events_site_ts ON events(site, recv_ts);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_events_site_event_ts ON events(site, event, recv_ts);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_events_slug ON events(site, game_slug, recv_ts);");
  db.exec(`CREATE TABLE IF NOT EXISTS sync_state (
    site TEXT PRIMARY KEY, last_recv_ts INTEGER NOT NULL DEFAULT 0
  );`);
  return db;
}

export function insertEvent(row) {
  const d = getDb();
  d.prepare(
    `INSERT INTO events
      (site, ts, recv_ts, sid, event, path, game_slug, ref,
       utm_source, utm_medium, utm_campaign, vp, ua, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    SITE,
    row.ts,
    row.recv_ts,
    row.sid,
    row.event,
    row.path,
    row.game_slug ?? null,
    row.ref ?? null,
    row.utm_source ?? null,
    row.utm_medium ?? null,
    row.utm_campaign ?? null,
    row.vp ?? null,
    row.ua ?? null,
    row.ip_hash ?? null
  );
}

export function pullEvents(since, limit) {
  const d = getDb();
  return d
    .prepare(
      `SELECT id, site, ts, recv_ts, sid, event, path, game_slug, ref,
              utm_source, utm_medium, utm_campaign, vp, ua, ip_hash
       FROM events WHERE recv_ts > ? ORDER BY recv_ts ASC LIMIT ?`
    )
    .all(since, limit);
}

export function countEvents(since = 0) {
  const d = getDb();
  return d.prepare("SELECT COUNT(*) AS n FROM events WHERE recv_ts > ?").get(since).n;
}

export function deleteByPath(path) {
  const d = getDb();
  return d.prepare("DELETE FROM events WHERE path = ?").run(path).changes;
}
