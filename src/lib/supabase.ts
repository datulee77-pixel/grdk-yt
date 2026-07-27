import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { AUDIO_MIME_TYPES, IMAGE_MIME_TYPES } from "@/types";

const bucket = process.env.SUPABASE_TEMP_VIDEOS_BUCKET || "temp-videos";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Supabase storage is not configured.");
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function getTemporaryVideoBucket() {
  return bucket;
}

export function getUserStoragePrefix(email?: string | null) {
  if (!email) throw new Error("A signed-in user email is required.");
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 24);
}

export async function ensureTemporaryVideoBucket() {
  const supabase = getSupabase();
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if (!buckets.some((item) => item.id === bucket)) {
    const { error: createError } = await supabase.storage.createBucket(bucket, {
      public: false,
      allowedMimeTypes: [
        ...AUDIO_MIME_TYPES,
        ...IMAGE_MIME_TYPES,
        "video/mp4",
      ],
    });
    if (createError) throw createError;
  }
  return supabase;
}

export async function getTemporaryVideoSignedUrl(storagePath: string) {
  const supabase = await ensureTemporaryVideoBucket();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 60 * 60);
  if (error || !data?.signedUrl) throw error || new Error("Could not create preview URL.");
  return data.signedUrl;
}

export async function createTemporaryUpload(storagePath: string) {
  const supabase = await ensureTemporaryVideoBucket();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(storagePath);
  if (error || !data?.token) {
    throw error || new Error("Could not create an upload URL.");
  }
  return { path: data.path, token: data.token };
}

export async function downloadTemporaryFile(storagePath: string) {
  const supabase = await ensureTemporaryVideoBucket();
  const { data, error } = await supabase.storage.from(bucket).download(storagePath);
  if (error || !data) throw error || new Error("Could not download the source file.");
  return data;
}

export async function removeTemporaryFiles(storagePaths: string[]) {
  if (!storagePaths.length) return;
  const supabase = await ensureTemporaryVideoBucket();
  const { error } = await supabase.storage.from(bucket).remove(storagePaths);
  if (error) throw error;
}

export async function queueVideoForDeletion(storagePath: string) {
  const supabase = await ensureTemporaryVideoBucket();
  const filename = storagePath.split("/").pop();
  if (!filename) throw new Error("Invalid temporary video path.");
  const queuedPath = `cleanup/${Date.now() + 60_000}/${filename}`;
  const { error } = await supabase.storage.from(bucket).move(storagePath, queuedPath);
  if (error) throw error;
}

export async function removeDueTemporaryVideos(now = Date.now()) {
  const supabase = await ensureTemporaryVideoBucket();
  const { data: folders, error } = await supabase.storage.from(bucket).list("cleanup", { limit: 1000 });
  if (error) throw error;

  for (const folder of folders) {
    const deleteAt = Number(folder.name);
    if (!Number.isFinite(deleteAt) || deleteAt > now) continue;
    const prefix = `cleanup/${folder.name}`;
    const { data: files, error: listError } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
    if (listError) throw listError;
    const paths = files.filter((file) => file.name).map((file) => `${prefix}/${file.name}`);
    if (paths.length) {
      const { error: removeError } = await supabase.storage.from(bucket).remove(paths);
      if (removeError) throw removeError;
    }
  }
}
