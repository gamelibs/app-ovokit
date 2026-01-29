export async function GET(
  req: Request,
  { params }: { params: Promise<{ collection: string; gameId: string }> },
) {
  const { collection, gameId } = await params;
  const current = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? current.host;
  const proto = req.headers.get("x-forwarded-proto") ?? current.protocol.replace(":", "");
  const origin = `${proto}://${host}`;
  return Response.redirect(new URL(`/embed/games/${collection}/${gameId}/index.html`, origin), 307);
}
