import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_TEMP_VIDEOS_BUCKET || "temp-videos";
const retentionMs = 24 * 60 * 60 * 1000;

if (!url || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const expiresBefore = Date.now() - retentionMs;
const { data: userFolders, error } = await supabase.storage.from(bucket).list("", { limit: 1000 });
if (error) throw error;

let removed = 0;
for (const userFolder of userFolders) {
  if (!userFolder.name) continue;
  const activePath = `${userFolder.name}/active`;
  const { data: files, error: listError } = await supabase.storage.from(bucket).list(activePath, { limit: 1000 });
  if (listError) throw listError;
  const expiredPaths = files
    .filter((file) => file.name && file.created_at && Date.parse(file.created_at) <= expiresBefore)
    .map((file) => `${activePath}/${file.name}`);
  if (!expiredPaths.length) continue;
  const { error: removeError } = await supabase.storage.from(bucket).remove(expiredPaths);
  if (removeError) throw removeError;
  removed += expiredPaths.length;
}

console.log(`Removed ${removed} expired temporary video(s).`);
