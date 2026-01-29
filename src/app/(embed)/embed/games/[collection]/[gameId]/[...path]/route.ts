import { promises as fs } from "node:fs";
import path from "node:path";

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".woff2":
      return "font/woff2";
    case ".ttf":
      return "font/ttf";
    case ".mp3":
      return "audio/mpeg";
    default:
      return "application/octet-stream";
  }
}

function gamesRoot() {
  return path.join(process.cwd(), "games");
}

function resolveSafe(relativePath: string) {
  const root = gamesRoot();
  const resolved = path.join(root, relativePath);
  const normalizedRoot = path.normalize(root + path.sep);
  const normalizedResolved = path.normalize(resolved);
  if (!normalizedResolved.startsWith(normalizedRoot)) return null;
  return normalizedResolved;
}

export async function GET(
  _: Request,
  {
    params,
  }: {
    params: Promise<{ collection: string; gameId: string; path: string[] }>;
  },
) {
  const { collection, gameId, path: parts } = await params;
  const rel = parts.length === 0 ? "index.html" : parts.join("/");
  const resolved = resolveSafe(path.join(collection, gameId, rel));
  if (!resolved) return new Response("Not found", { status: 404 });

  try {
    const data = await fs.readFile(resolved);
    return new Response(data, {
      headers: {
        "content-type": contentTypeFor(resolved),
        "cache-control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

