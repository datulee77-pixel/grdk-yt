import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { auth } from "@/lib/auth";
import { VIDEOS_DIR } from "@/lib/ffmpeg";
import { sanitizeFilename } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileParam = searchParams.get("file");

  if (!fileParam) {
    return NextResponse.json(
      { error: "Missing 'file' query parameter." },
      { status: 400 }
    );
  }

  // Prevent directory traversal
  const safeName = sanitizeFilename(fileParam);
  if (!safeName) {
    return NextResponse.json({ error: "Invalid filename." }, { status: 400 });
  }

  const filePath = path.join(VIDEOS_DIR, safeName);
  const resolved = path.resolve(filePath);

  // Ensure resolved path stays inside the videos directory
  const videosDirectory = `${path.resolve(VIDEOS_DIR)}${path.sep}`;
  if (!resolved.startsWith(videosDirectory)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  if (!fs.existsSync(resolved)) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const stat = fs.statSync(resolved);
  const range = req.headers.get("range");

  // Support HTTP range requests for smooth video seeking
  if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!match) {
      return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${stat.size}` } });
    }
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : stat.size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stat.size || end >= stat.size) {
      return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${stat.size}` } });
    }
    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(resolved, { start, end });

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": chunkSize.toString(),
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      },
    });
  }

  // Full file response
  const stream = fs.createReadStream(resolved);
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": stat.size.toString(),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    },
  });
}
