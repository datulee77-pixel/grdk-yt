import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import path from "path";
import fs from "fs";

// Point fluent-ffmpeg at the bundled binaries
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

// Directories for generated videos and temporary files
const DATA_DIR = path.join(process.cwd(), ".data");
export const VIDEOS_DIR = path.join(DATA_DIR, "videos");
export const TEMP_DIR = path.join(DATA_DIR, "temp");

/**
 * Ensure the required data directories exist.
 */
export function ensureDirectories(): void {
  for (const dir of [DATA_DIR, VIDEOS_DIR, TEMP_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Probe a media file and return its duration in seconds.
 */
export function getDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to probe file: ${err.message}`));
        return;
      }
      const duration = metadata.format.duration ?? 0;
      resolve(Math.round(duration));
    });
  });
}

interface GenerateVideoOptions {
  audioPath: string;
  imagePath: string;
  outputPath: string;
}

/**
 * Generate a Full HD YouTube-ready MP4 from a static image + audio track.
 * Uses YouTube-standard codec settings.
 */
export function generateVideo(options: GenerateVideoOptions): Promise<void> {
  const { audioPath, imagePath, outputPath } = options;

  return new Promise((resolve, reject) => {
    ffmpeg()
      // Loop the still image for the full audio duration
      .input(imagePath)
      .inputOptions(["-loop 1"])
      .input(audioPath)
      .outputOptions([
        "-c:v libx264", // H.264 codec (YouTube standard)
        "-tune stillimage", // Optimized for static images
        "-pix_fmt yuv420p", // YouTube required pixel format
        // Scale to fit within 1920x1080 and pad to exact Full HD
        "-vf scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black",
        "-r 30", // 30 fps
        "-c:a aac", // AAC audio codec
        "-b:a 192k", // 192kbps audio bitrate
        "-movflags +faststart", // Enable streaming start
        "-shortest", // Follow audio duration
      ])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err: Error) => {
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .run();
  });
}