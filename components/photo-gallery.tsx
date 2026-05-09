"use client";

import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { BookingPhoto } from "@/lib/store";
import { cn } from "@/lib/utils";

export function PhotoGallery({
  photos,
  className,
}: {
  photos: BookingPhoto[];
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight")
        setOpenIndex((i) => (i === null ? null : (i + 1) % photos.length));
      if (e.key === "ArrowLeft")
        setOpenIndex((i) =>
          i === null ? null : (i - 1 + photos.length) % photos.length
        );
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, photos.length]);

  if (photos.length === 0) return null;

  return (
    <>
      <ul className={cn("grid grid-cols-3 gap-2 sm:grid-cols-4", className)}>
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="block aspect-square w-full overflow-hidden rounded-[10px] border border-rule bg-paper focus-ring active:translate-y-px"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={`Job photo ${i + 1}`}
                loading="lazy"
                className="size-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null && (
        <Lightbox
          photo={photos[openIndex]}
          index={openIndex}
          total={photos.length}
          onClose={() => setOpenIndex(null)}
          onPrev={() =>
            setOpenIndex((i) =>
              i === null ? null : (i - 1 + photos.length) % photos.length
            )
          }
          onNext={() =>
            setOpenIndex((i) =>
              i === null ? null : (i + 1) % photos.length
            )
          }
        />
      )}
    </>
  );
}

function Lightbox({
  photo,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  photo: BookingPhoto;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo"
      className="fixed inset-0 z-[60] flex flex-col bg-ink/95 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-4 text-paper">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-paper/60">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-10 place-items-center rounded-full bg-paper/10 hover:bg-paper/20"
        >
          <X className="size-5" />
        </button>
      </div>
      <div
        className="flex flex-1 items-center justify-center overflow-hidden p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt="Full-size job photo"
          className="max-h-full max-w-full rounded-[10px] object-contain"
        />
      </div>
      {total > 1 && (
        <div className="flex items-center justify-between gap-3 p-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Previous"
            className="grid size-12 place-items-center rounded-full bg-paper/10 text-paper hover:bg-paper/20"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Next"
            className="grid size-12 place-items-center rounded-full bg-paper/10 text-paper hover:bg-paper/20"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
