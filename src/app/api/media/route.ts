import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { VIDEOS_DIR } from "@/lib/ffmpeg";
import { sanitizeFilename } from "@/lib/utils";

export async function GET(req: NextRequest) {
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
  if (!resolved.startsWith(path.resolve(VIDEOS_DIR))) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  if (!fs.existsSync(resolved)) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const stat = fs.statSync(resolved);
  const range = req.headers.get("range");

  // Support HTTP range requests for smooth video seeking
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(resolved, { start, end });

    return new NextResponse(stream as unknown as ReadableStream, {
      status: 206,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": chunkSize.toString(),
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Full file response
  const stream = fs.createReadStream(resolved);
  return new NextResponse(stream as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": stat.size.toString(),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}