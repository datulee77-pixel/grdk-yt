"use client";

import { useCallback, useRef, useState } from "react";
import { Music, ImageIcon, X, UploadCloud } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import {
  AUDIO_MIME_TYPES,
  IMAGE_MIME_TYPES,
  MAX_AUDIO_SIZE,
  MAX_IMAGE_SIZE,
} from "@/types";

interface FileUploadProps {
  audioFile: File | null;
  imageFile: File | null;
  onAudioChange: (file: File | null) => void;
  onImageChange: (file: File | null) => void;
  disabled?: boolean;
}

type DropKind = "audio" | "image";

export default function FileUpload({
  audioFile,
  imageFile,
  onAudioChange,
  onImageChange,
  disabled = false,
}: FileUploadProps) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState<DropKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateAndSet = useCallback(
    (kind: DropKind, file: File) => {
      setError(null);
      if (kind === "audio") {
        if (!AUDIO_MIME_TYPES.includes(file.type)) {
          setError("Invalid audio format. Use MP3, WAV, M4A, or AAC.");
          return;
        }
        if (file.size > MAX_AUDIO_SIZE) {
          setError("Audio file is too large (max 5GB).");
          return;
        }
        onAudioChange(file);
      } else {
        if (!IMAGE_MIME_TYPES.includes(file.type)) {
          setError("Invalid image format. Use JPG, PNG, or WebP.");
          return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
          setError("Image file is too large (max 500MB).");
          return;
        }
        onImageChange(file);
      }
    },
    [onAudioChange, onImageChange]
  );

  const handleDrop = useCallback(
    (kind: DropKind, e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(null);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) validateAndSet(kind, file);
    },
    [disabled, validateAndSet]
  );

  const dropZoneClass = (kind: DropKind, hasFile: boolean) =>
    `relative flex flex-col items-center justify-center border border-dashed rounded-xl p-6 transition-all cursor-pointer min-h-[172px] ${
      dragOver === kind
        ? "border-violet-300 bg-violet-400/[0.08] shadow-[0_0_0_4px_rgba(167,139,250,0.07)]"
        : hasFile
          ? "border-emerald-400/50 bg-emerald-400/[0.06]"
          : "border-white/[0.10] hover:border-violet-300/60 hover:bg-white/[0.025] bg-dark-900/30"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Audio drop zone */}
        <div
          className={dropZoneClass("audio", !!audioFile)}
          onClick={() => !disabled && audioInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver("audio");
          }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => handleDrop("audio", e)}
        >
          <input
            ref={audioInputRef}
            type="file"
            accept={AUDIO_MIME_TYPES.join(",")}
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) validateAndSet("audio", file);
            }}
          />
          {audioFile ? (
            <div className="text-center">
              <span className="w-11 h-11 rounded-xl bg-emerald-400/10 grid place-items-center mx-auto mb-3"><Music className="w-5 h-5 text-emerald-400" /></span>
              <p className="text-light text-sm font-medium truncate max-w-[200px]">
                {audioFile.name}
              </p>
              <p className="text-dark-600 text-xs">{formatFileSize(audioFile.size)}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAudioChange(null);
                }}
                className="mt-2 inline-flex items-center gap-1 text-red-300 text-xs hover:text-red-200"
                disabled={disabled}
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          ) : (
            <div className="text-center">
              <span className="w-11 h-11 rounded-xl bg-violet-400/10 grid place-items-center mx-auto mb-3"><Music className="w-5 h-5 text-violet-300" /></span>
              <p className="text-light text-sm font-medium">Drop your audio here</p>
              <p className="text-dark-600 text-xs mt-1">MP3, WAV, M4A, AAC · up to 5GB</p>
            </div>
          )}
        </div>

        {/* Image drop zone */}
        <div
          className={dropZoneClass("image", !!imageFile)}
          onClick={() => !disabled && imageInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver("image");
          }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => handleDrop("image", e)}
        >
          <input
            ref={imageInputRef}
            type="file"
            accept={IMAGE_MIME_TYPES.join(",")}
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) validateAndSet("image", file);
            }}
          />
          {imageFile ? (
            <div className="text-center">
              <span className="w-11 h-11 rounded-xl bg-emerald-400/10 grid place-items-center mx-auto mb-3"><ImageIcon className="w-5 h-5 text-emerald-400" /></span>
              <p className="text-light text-sm font-medium truncate max-w-[200px]">
                {imageFile.name}
              </p>
              <p className="text-dark-600 text-xs">{formatFileSize(imageFile.size)}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onImageChange(null);
                }}
                className="mt-2 inline-flex items-center gap-1 text-red-300 text-xs hover:text-red-200"
                disabled={disabled}
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          ) : (
            <div className="text-center">
              <span className="w-11 h-11 rounded-xl bg-violet-400/10 grid place-items-center mx-auto mb-3"><ImageIcon className="w-5 h-5 text-violet-300" /></span>
              <p className="text-light text-sm font-medium">Drop your cover art here</p>
              <p className="text-dark-600 text-xs mt-1">JPG, PNG, WebP · up to 500MB</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-accent-red/10 border border-accent-red/40 text-red-300 rounded-xl px-4 py-2 text-sm">
          <UploadCloud className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
