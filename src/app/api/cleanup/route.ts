import { NextRequest, NextResponse } from "next/server";
import { removeDueTemporaryVideos } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await removeDueTemporaryVideos();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Temporary-video cleanup failed", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
