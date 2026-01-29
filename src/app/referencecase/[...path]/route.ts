export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const suffix = path.length ? `/${path.join("/")}` : "";
  const current = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? current.host;
  const proto = req.headers.get("x-forwarded-proto") ?? current.protocol.replace(":", "");
  const origin = `${proto}://${host}`;
  return Response.redirect(new URL(`/embed/demos/sliding-puzzle-3d${suffix}`, origin), 307);
}
