import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { auth } from "@/lib/auth";
import {
  ensureDirectories,
  generateVideo,
  getDuration,
  VIDEOS_DIR,
  TEMP_DIR,
} from "@/lib/ffmpeg";
import { generateFilename } from "@/lib/utils";
import {
  downloadTemporaryFileStream,
  ensureTemporaryVideoBucket,
  getTemporaryVideoBucket,
  getTemporaryVideoSignedUrl,
  getUserStoragePrefix,
  removeTemporaryFiles,
} from "@/lib/supabase";

export const maxDuration = 300;

interface GenerateBody {
  audioPath: string;
  imagePath: string;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  ensureDirectories();
  let audioTempPath: string | null = null;
  let imageTempPath: string | null = null;
  let outputPath: string | null = null;
  let sourcePaths: string[] = [];

  try {
    const { audioPath, imagePath } = (await request.json()) as GenerateBody;
    const inputPrefix = `${getUserStoragePrefix(session.user.email)}/inputs/`;
    if (
      typeof audioPath !== "string" ||
      typeof imagePath !== "string" ||
      !audioPath.startsWith(inputPrefix) ||
      !imagePath.startsWith(inputPrefix)
    ) {
      return NextResponse.json(
        { error: "Invalid source file paths." },
        { status: 400 }
      );
    }

    sourcePaths = [audioPath, imagePath];
    const [audioStream, imageStream] = await Promise.all([
      downloadTemporaryFileStream(audioPath),
      downloadTemporaryFileStream(imagePath),
    ]);
    audioTempPath = path.join(
      TEMP_DIR,
      generateFilename(path.extname(audioPath).slice(1))
    );
    imageTempPath = path.join(
      TEMP_DIR,
      generateFilename(path.extname(imagePath).slice(1))
    );
    await Promise.all([
      pipeline(
        Readable.fromWeb(audioStream as unknown as import("stream/web").ReadableStream),
        fs.createWriteStream(audioTempPath)
      ),
      pipeline(
        Readable.fromWeb(imageStream as unknown as import("stream/web").ReadableStream),
        fs.createWriteStream(imageTempPath)
      ),
    ]);

    const outputFilename = generateFilename("mp4");
    outputPath = path.join(VIDEOS_DIR, outputFilename);
    await generateVideo({ audioPath: audioTempPath, imagePath: imageTempPath, outputPath });
    const duration = await getDuration(outputPath);

    const storagePath = `${getUserStoragePrefix(session.user.email)}/active/${outputFilename}`;
    const supabase = await ensureTemporaryVideoBucket();
    const { error: storageError } = await supabase.storage
      .from(getTemporaryVideoBucket())
      .upload(storagePath, fs.createReadStream(outputPath), {
        contentType: "video/mp4",
        upsert: false,
      });
    if (storageError) throw storageError;

    return NextResponse.json({
      videoPath: storagePath,
      videoUrl: await getTemporaryVideoSignedUrl(storagePath),
      duration,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown FFmpeg error";
    console.error("Video generation error:", error);
    return NextResponse.json(
      { error: "Video generation failed.", details },
      { status: 500 }
    );
  } finally {
    await Promise.all(
      [audioTempPath, imageTempPath, outputPath]
        .filter((filePath): filePath is string => Boolean(filePath))
        .map(async (filePath) => {
          if (!fs.existsSync(filePath)) return;
          try {
            await fsPromises.unlink(filePath);
          } catch {
            // Best-effort cleanup of Render's ephemeral disk.
          }
        })
    );
    if (sourcePaths.length) {
      try {
        await removeTemporaryFiles(sourcePaths);
      } catch {
        // The cleanup endpoint can remove leftovers if Supabase is temporarily unavailable.
      }
    }
  }
}
