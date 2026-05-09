import { NextResponse } from "next/server";
import {
  ALLOWED_MIME,
  MAX_BYTES,
  saveUpload,
} from "@/lib/uploads-store";

const MAX_PHOTOS_PER_REQUEST = 5;

type ClientPhoto = {
  /** data URL like "data:image/jpeg;base64,…" */
  dataUrl: string;
  width?: number;
  height?: number;
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const photos = (body as { photos?: ClientPhoto[] })?.photos;
  if (!Array.isArray(photos) || photos.length === 0) {
    return NextResponse.json({ error: "No photos" }, { status: 400 });
  }
  if (photos.length > MAX_PHOTOS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Max ${MAX_PHOTOS_PER_REQUEST} photos per request` },
      { status: 400 }
    );
  }

  const out: { id: string; url: string; mimeType: string; width?: number; height?: number }[] = [];
  for (const photo of photos) {
    const parsed = decodeDataUrl(photo.dataUrl);
    if (!parsed) {
      return NextResponse.json({ error: "Bad data URL" }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(parsed.mimeType)) {
      return NextResponse.json(
        { error: `Unsupported type: ${parsed.mimeType}` },
        { status: 415 }
      );
    }
    if (parsed.bytes.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: `Image too large (${(parsed.bytes.byteLength / 1024 / 1024).toFixed(1)} MB > ${MAX_BYTES / 1024 / 1024} MB)` },
        { status: 413 }
      );
    }

    const stored = await saveUpload({
      mimeType: parsed.mimeType,
      bytes: parsed.bytes,
    });
    out.push({
      id: stored.id,
      url: stored.url,
      mimeType: stored.mimeType,
      width: photo.width,
      height: photo.height,
    });
  }

  return NextResponse.json({ photos: out }, { status: 201 });
}

function decodeDataUrl(dataUrl: string): { mimeType: string; bytes: Buffer } | null {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  try {
    return { mimeType: m[1], bytes: Buffer.from(m[2], "base64") };
  } catch {
    return null;
  }
}
