"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { MAX_PHOTOS, MAX_PHOTO_BYTES, ACCEPTED_PHOTO_TYPES } from "@/lib/validation";
import { useLanguage } from "@/components/layout/language-provider";
import { cn } from "@/lib/utils";

export type PhotoItem = {
  id: string;
  file: File;
  previewUrl: string;
};

export function PhotoUploader({
  photos,
  onAddFiles,
  onRemove,
  error,
  disabled,
  maxPhotos = MAX_PHOTOS,
}: {
  photos: PhotoItem[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
  error?: string;
  disabled?: boolean;
  maxPhotos?: number;
}) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const atLimit = photos.length >= maxPhotos;
  const blockAdd = Boolean(disabled) || atLimit;
  const maxSizeMb = Math.round(MAX_PHOTO_BYTES / 1024 / 1024);

  return (
    <div>
      <div
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
          dragging ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-ink-50/40",
          blockAdd && "opacity-60",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          if (!blockAdd) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!blockAdd && event.dataTransfer.files.length > 0) {
            onAddFiles(event.dataTransfer.files);
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_PHOTO_TYPES.join(",")}
          multiple
          className="sr-only"
          disabled={blockAdd}
          onChange={(event) => {
            if (event.target.files?.length) onAddFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
          <UploadCloud className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-3 text-sm font-medium text-ink-800">
          {atLimit ? t("report.photoUploader.limitReached") : t("report.photoUploader.dropOrBrowse")}
        </p>
        <p className="mt-1 text-xs text-ink-400">
          {maxPhotos === 1
            ? t("report.photoUploader.hintOne", { size: maxSizeMb })
            : t("report.photoUploader.hintMany", { max: maxPhotos, size: maxSizeMb })}
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={blockAdd}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-800 shadow-sm transition-colors hover:bg-ink-50 disabled:pointer-events-none disabled:opacity-50"
        >
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          {t("report.photoUploader.choosePhotos")}
        </button>
        <p className="mt-3 text-[11px] text-ink-400">{t("report.photoUploader.footerNote")}</p>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-critical-600">
          {error}
        </p>
      ) : null}

      {photos.length > 0 ? (
        <ul className="mt-4 grid grid-cols-3 gap-3">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-ink-100 bg-ink-50"
            >
              <Image
                src={photo.previewUrl}
                alt={`Selected photo: ${photo.file.name}`}
                fill
                unoptimized
                sizes="(min-width: 640px) 200px, 33vw"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(photo.id)}
                disabled={disabled}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-teal-950/70 text-white backdrop-blur transition-colors hover:bg-critical-600 disabled:opacity-50"
                aria-label={`Remove ${photo.file.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-teal-950/80 to-transparent px-2 pb-1.5 pt-5 text-[10px] text-white">
                {photo.file.name}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
