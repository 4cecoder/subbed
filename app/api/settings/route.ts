import { NextResponse } from "next/server";
import { readSettings, writeSettings } from "../../../lib/settings";

export async function GET() {
  try {
    const s = await readSettings();
    return NextResponse.json({ settings: s });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const allowed: any = {};
    if (typeof body.per_page === "number") allowed.per_page = Math.max(1, Math.floor(body.per_page));
    if (typeof body.per_channel === "number") allowed.per_channel = Math.max(1, Math.floor(body.per_channel));
    if (typeof body.showThumbnails === "boolean") allowed.showThumbnails = body.showThumbnails;
    if (typeof body.showDescriptions === "boolean") allowed.showDescriptions = body.showDescriptions;
    if (typeof body.defaultFeedType === "string" && ["all", "video", "short"].includes(body.defaultFeedType)) allowed.defaultFeedType = body.defaultFeedType;
    if (typeof body.sortOrder === "string" && ["newest", "oldest"].includes(body.sortOrder)) allowed.sortOrder = body.sortOrder;
    if (typeof body.caching_ttl === "number") allowed.caching_ttl = Math.max(0, Math.floor(body.caching_ttl));
    if (typeof body.concurrency === "number") allowed.concurrency = Math.max(1, Math.floor(body.concurrency));

    const updated = await writeSettings(allowed);
    return NextResponse.json({ settings: updated });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
