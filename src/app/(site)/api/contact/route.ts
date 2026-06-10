import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

const CONTACT_DIR = path.join(process.cwd(), "content", "contact-messages");

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };

  const { name, email, subject, message } = body;

  if (!name || !email || !subject || !message) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  // Simple validation
  if (message.length < 10) {
    return new NextResponse("Message too short (min 10 characters)", { status: 400 });
  }
  if (message.length > 5000) {
    return new NextResponse("Message too long (max 5000 characters)", { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new NextResponse("Invalid email", { status: 400 });
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry = {
    id,
    name: name.trim(),
    email: email.trim(),
    subject: subject.trim(),
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };

  try {
    await fs.mkdir(CONTACT_DIR, { recursive: true });
    const filePath = path.join(CONTACT_DIR, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2) + "\n", "utf8");
  } catch {
    return new NextResponse("Failed to save message", { status: 500 });
  }

  return NextResponse.json({ ok: true, id });
}
