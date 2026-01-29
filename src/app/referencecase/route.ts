export async function GET(req: Request) {
  const current = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? current.host;
  const proto = req.headers.get("x-forwarded-proto") ?? current.protocol.replace(":", "");
  const origin = `${proto}://${host}`;
  return Response.redirect(new URL("/embed/demos/sliding-puzzle-3d", origin), 307);
}
