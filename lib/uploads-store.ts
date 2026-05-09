// In-memory image bytes for the demo. Swap to Vercel Blob before launch:
//
//   import { put } from '@vercel/blob';
//   const blob = await put(filename, buffer, { access: 'public' });
//   return { url: blob.url, mimeType };
//
// Until then, bytes live in this module-level Map and are served by /api/uploads/[id].

import { randomUUID } from "node:crypto";

export type StoredUpload = {
  id: string;
  mimeType: string;
  bytes: Buffer;
  createdAt: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __HANDIMANNY_UPLOADS__: Map<string, StoredUpload> | undefined;
}

const store: Map<string, StoredUpload> = (globalThis.__HANDIMANNY_UPLOADS__ ??=
  new Map());

export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

/** Max bytes per uploaded image (after client-side compression). */
export const MAX_BYTES = 2 * 1024 * 1024;

export function saveUpload(opts: {
  mimeType: string;
  bytes: Buffer;
}): StoredUpload {
  const upload: StoredUpload = {
    id: randomUUID(),
    mimeType: opts.mimeType,
    bytes: opts.bytes,
    createdAt: new Date().toISOString(),
  };
  store.set(upload.id, upload);
  return upload;
}

export function getUpload(id: string): StoredUpload | undefined {
  return store.get(id);
}
