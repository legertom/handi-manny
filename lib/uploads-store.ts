import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "./supabase/admin";

export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export const MAX_BYTES = 2 * 1024 * 1024;

const BUCKET = "booking-photos";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export type StoredUpload = {
  id: string;
  url: string;
  mimeType: string;
};

export async function saveUpload(opts: {
  mimeType: string;
  bytes: Buffer;
}): Promise<StoredUpload> {
  const id = randomUUID();
  const ext = MIME_TO_EXT[opts.mimeType] ?? "bin";
  const path = `${id}.${ext}`;

  const { error } = await supabaseAdmin().storage
    .from(BUCKET)
    .upload(path, opts.bytes, {
      contentType: opts.mimeType,
      upsert: false,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabaseAdmin().storage.from(BUCKET).getPublicUrl(path);

  return { id, url: publicUrl, mimeType: opts.mimeType };
}
