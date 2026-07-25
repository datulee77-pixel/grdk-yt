import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import fs_promises from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import {
  ensureDirectories,
  generateVideo,
  getDuration,
  VIDEOS_DIR,
  TEMP_DIR,
} from "@/lib/ffmpeg";
import {
  generateFilename,
  getExtensionFromMime,
} from "@/lib/utils";
import {
  AUDIO_MIME_TYPES,
  IMAGE_MIME_TYPES,
  MAX_AUDIO_SIZE,
  MAX_IMAGE_SIZE,
} from "@/types";
import { ensureTemporaryVideoBucket, getTemporaryVideoBucket, getTemporaryVideoSignedUrl, getUserStoragePrefix } from "@/lib/supabase";

// Allow long-running FFmpeg jobs
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  // Require authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized - Please sign in first" },
      { status: 401 }
    );
  }

  ensureDirectories();

  let audioTempPath: string | null = null;
  let imageTempPath: string | null = null;
  let outputPath: string | null = null;

  try {
    const formData = await req.formData();
    const audio = formData.get("audio");
    const image = formData.get("image");

    // Validate presence
    if (!(audio instanceof File) || !(image instanceof File)) {
      return NextResponse.json(
        { error: "Both an audio file and an image file are required." },
        { status: 400 }
      );
    }

    // Validate MIME types
    if (!AUDIO_MIME_TYPES.includes(audio.type)) {
      return NextResponse.json(
        { error: "Invalid audio format. Use MP3, WAV, M4A, or AAC." },
        { status: 400 }
      );
    }
    if (!IMAGE_MIME_TYPES.includes(image.type)) {
      return NextResponse.json(
        { error: "Invalid image format. Use JPG, PNG, or WebP." },
        { status: 400 }
      );
    }

    // Validate sizes
    if (audio.size > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { error: "Audio file too large (max 5GB)." },
        { status: 413 }
      );
    }
    if (image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "Image file too large (max 500MB)." },
        { status: 413 }
      );
    }

    // Check for empty (corrupt) files
    if (audio.size === 0 || image.size === 0) {
      return NextResponse.json(
        { error: "One of the uploaded files appears to be empty or corrupt." },
        { status: 400 }
      );
    }

    // Write temp files
    const audioExt = getExtensionFromMime(audio.type);
    const imageExt = getExtensionFromMime(image.type);
    audioTempPath = path.join(TEMP_DIR, generateFilename(audioExt));
    imageTempPath = path.join(TEMP_DIR, generateFilename(imageExt));

    const audioBuffer = Buffer.from(await audio.arrayBuffer());
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    await fs_promises.writeFile(audioTempPath, audioBuffer);
    await fs_promises.writeFile(imageTempPath, imageBuffer);

    // Generate the video
    const outputFilename = generateFilename("mp4");
    outputPath = path.join(VIDEOS_DIR, outputFilename);

    await generateVideo({
      audioPath: audioTempPath,
      imagePath: imageTempPath,
      outputPath,
    });

    // Determine duration
    const duration = await getDuration(outputPath);
    const storagePath = `${getUserStoragePrefix(session.user.email)}/active/${outputFilename}`;
    const supabase = await ensureTemporaryVideoBucket();
    const videoBuffer = await fs_promises.readFile(outputPath);
    const { error: storageError } = await supabase.storage
      .from(getTemporaryVideoBucket())
      .upload(storagePath, videoBuffer, { contentType: "video/mp4", upsert: false });
    if (storageError) throw storageError;
    const videoUrl = await getTemporaryVideoSignedUrl(storagePath);

    await fs_promises.unlink(outputPath);
    outputPath = null;

    return NextResponse.json({
      videoPath: storagePath,
      videoUrl,
      duration,
    });
  } catch (error) {
    console.log("Video generation error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown FFmpeg error";
    return NextResponse.json(
      { error: "Video generation failed.", details: message },
      { status: 500 }
    );
  } finally {
    // Clean up temp inputs
    for (const p of [audioTempPath, imageTempPath]) {
      if (p && fs.existsSync(p)) {
        try {
          await fs_promises.unlink(p);
        } catch {
          // ignore cleanup errors
        }
      }
    }
    if (outputPath && fs.existsSync(outputPath)) {
      try { await fs_promises.unlink(outputPath); } catch { /* ignore cleanup errors */ }
    }
  }
}
