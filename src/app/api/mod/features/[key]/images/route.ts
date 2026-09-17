import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { isModerator } from "@/lib/mod/auth";
import { isFeatureKey } from "@/lib/features/features";
import { promises as fs } from "node:fs";
import { processUploadedImage, sanitizeImageFilename } from "@/lib/mod/image-upload";

function featureImageDir(key: string) {
  return path.join(process.cwd(), "public", "features", key);
}

interface RouteContext {
  params: Promise<{ key: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  if (!(await isModerator())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;
  if (!isFeatureKey(key)) {
    return NextResponse.json({ error: "Invalid feature key" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  try {
    const dir = featureImageDir(key);
    const result = await processUploadedImage(file, dir);
    return NextResponse.json({ ok: true, filename: result.filename });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: e instanceof Error && e.message.includes("too large") ? 413 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  if (!(await isModerator())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;
  if (!isFeatureKey(key)) {
    return NextResponse.json({ error: "Invalid feature key" }, { status: 400 });
  }

  const searchParams = req.nextUrl.searchParams;
  const filename = searchParams.get("filename");
  if (!filename) {
    return NextResponse.json({ error: "Missing filename" }, { status: 400 });
  }

  const safe = sanitizeImageFilename(filename);
  if (safe !== filename || safe.includes("/") || safe.includes("\\")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    const dir = featureImageDir(key);
    const target = path.join(dir, safe);
    await fs.unlink(target);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 }
    );
  }
}
