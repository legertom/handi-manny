"use client";

import { useId, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingPhoto } from "@/lib/store";

const MAX_PHOTOS = 5;
const MAX_DIMENSION = 1600;
const COMPRESS_QUALITY = 0.78;

type LocalPhoto = BookingPhoto & {
  /** Local object URL for preview while still uploading. */
  previewUrl?: string;
};

export function PhotoUploader({
  photos,
  onChange,
}: {
  photos: BookingPhoto[];
  onChange: (next: BookingPhoto[]) => void;
}) {
  const inputId = useId();
  const cameraId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const remaining = MAX_PHOTOS - photos.length;
  const localPhotos = photos as LocalPhoto[];

  async function handleFiles(files: FileList | File[]) {
    setError(null);
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) return;
    if (arr.length > remaining) {
      setError(`You can add up to ${MAX_PHOTOS} photos. Skipping the extras.`);
      arr.splice(remaining);
    }

    setUploading(true);
    try {
      const compressed = await Promise.all(
        arr.map(async (file) => {
          const out = await compressImage(file);
          return out;
        })
      );
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: compressed }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.error ?? "Upload failed");
      }
      const data = (await res.json()) as { photos: BookingPhoto[] };
      onChange([...photos, ...data.photos]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

  function remove(id: string) {
    onChange(photos.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-soft">
          {photos.length}/{MAX_PHOTOS} photos · helps Manny prep
        </span>
      </div>

      {/* Thumbs */}
      {photos.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {localPhotos.map((p) => (
            <li
              key={p.id}
              className="group relative aspect-square overflow-hidden rounded-[10px] border border-rule bg-paper"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.previewUrl ?? p.url}
                alt="Job photo"
                className="absolute inset-0 size-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label="Remove photo"
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-ink/90 text-paper opacity-100 transition-opacity hover:bg-ink sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add buttons */}
      {remaining > 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "mt-3 grid grid-cols-2 gap-2",
            dragging && "rounded-[12px] outline-2 outline-dashed outline-brand outline-offset-4"
          )}
        >
          <label
            htmlFor={cameraId}
            className={cn(
              "flex h-14 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-rule-strong bg-paper text-sm font-medium text-ink transition-colors active:translate-y-px sm:h-12",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            <Camera className="size-4" />
            Take photo
          </label>
          <input
            ref={cameraRef}
            id={cameraId}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
            }}
          />

          <label
            htmlFor={inputId}
            className={cn(
              "flex h-14 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-rule-strong bg-paper text-sm font-medium text-ink transition-colors active:translate-y-px sm:h-12",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            {uploading ? "Uploading…" : "Upload"}
          </label>
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
            }}
          />
        </div>
      )}

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-warning">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------------- Resize + compress on the client ---------------- */

async function compressImage(
  file: File
): Promise<{ dataUrl: string; width: number; height: number }> {
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const { width, height } = scaleDown(img.naturalWidth, img.naturalHeight, MAX_DIMENSION);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // Fallback: send as-is if canvas isn't available.
    return { dataUrl, width: img.naturalWidth, height: img.naturalHeight };
  }
  ctx.drawImage(img, 0, 0, width, height);

  // Always re-encode as JPEG for predictable size, except if the source is already small PNG.
  const out = canvas.toDataURL("image/jpeg", COMPRESS_QUALITY);
  return { dataUrl: out, width, height };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function scaleDown(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w > h ? max / w : max / h;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}
