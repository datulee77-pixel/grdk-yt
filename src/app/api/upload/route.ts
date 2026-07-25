import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { google } from "googleapis";
import { auth } from "@/lib/auth";
import type { VideoMetadata } from "@/types";
import { ensureTemporaryVideoBucket, getTemporaryVideoBucket, getUserStoragePrefix, queueVideoForDeletion } from "@/lib/supabase";

// YouTube uploads can take a while
export const maxDuration = 300;

interface UploadRequestBody {
  videoPath: string;
  metadata: VideoMetadata;
}

export async function POST(req: NextRequest) {
  // Require authentication + access token
  const session = await auth();
  if (!session?.user?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized - Please sign in first" },
      { status: 401 }
    );
  }

  if (session.error === "RefreshAccessTokenError") {
    return NextResponse.json(
      { error: "Session expired. Please sign in again." },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as UploadRequestBody;
    const { videoPath, metadata } = body;

    // Validate metadata
    if (!metadata || typeof metadata.title !== "string" || !metadata.title.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid metadata: title is required." },
        { status: 400 }
      );
    }
    if (metadata.title.length > 100) {
      return NextResponse.json(
        { error: "Title must be 100 characters or fewer." },
        { status: 400 }
      );
    }

    const userPrefix = `${getUserStoragePrefix(session.user.email)}/active/`;
    if (!videoPath.startsWith(userPrefix)) {
      return NextResponse.json({ error: "Invalid video path." }, { status: 400 });
    }

    const supabase = await ensureTemporaryVideoBucket();
    const { data: signedVideo, error: signedVideoError } = await supabase.storage
      .from(getTemporaryVideoBucket())
      .createSignedUrl(videoPath, 60 * 10);
    if (signedVideoError || !signedVideo?.signedUrl) return NextResponse.json({ error: "Video file not found." }, { status: 404 });
    const videoResponse = await fetch(signedVideo.signedUrl);
    if (!videoResponse.ok || !videoResponse.body) return NextResponse.json({ error: "Could not read the temporary video." }, { status: 502 });

    // Set up the OAuth2 client with the session access token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.user.accessToken });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // Upload the video
    const response = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: metadata.title,
          description: metadata.description || "",
          tags: metadata.tags || [],
          categoryId: metadata.categoryId || "22",
        },
        status: {
          privacyStatus: metadata.privacyStatus || "private",
        },
      },
      media: {
        body: Readable.fromWeb(videoResponse.body as unknown as import("stream/web").ReadableStream),
      },
    });

    const videoId = response.data.id;
    if (!videoId) {
      return NextResponse.json(
        { error: "YouTube upload failed: no video ID returned." },
        { status: 500 }
      );
    }

    // Queue Supabase cleanup for one minute after a confirmed YouTube upload.
    try {
      await queueVideoForDeletion(videoPath);
    } catch {
      // Preserve the temporary video if queueing fails; it can be removed manually.
    }

    return NextResponse.json({
      videoId,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      title: metadata.title,
    });
  } catch (error) {
    console.log("YouTube upload error:", error);

    // Detect quota errors
    const message = error instanceof Error ? error.message : "Unknown error";
    if (
      message.toLowerCase().includes("quota") ||
      message.includes("429")
    ) {
      return NextResponse.json(
        { error: "YouTube API quota exceeded. Try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "YouTube upload failed.", details: message },
      { status: 500 }
    );
  }
}
