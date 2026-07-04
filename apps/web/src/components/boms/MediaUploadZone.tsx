"use client";

import { useRef, useState } from "react";
import { Camera, Upload, Video, X, Loader2, ImageIcon, Mic } from "lucide-react";

export type MediaFileType = "image" | "video" | "audio";

export interface UploadedFile {
  name: string;
  url: string;
  mediaType?: MediaFileType;
}

interface Props {
  label?: string;
  accept?: string;
  category?: string;
  onUploaded?: (files: UploadedFile[]) => void;
  onSingleUploaded?: (file: UploadedFile) => void;
  showCameraButtons?: boolean;
}

export function MediaUploadZone({
  label = "Upload photos or videos",
  accept = "image/*,video/*",
  category = "supplier-completion",
  onUploaded,
  onSingleUploaded,
  showCameraButtons = false,
}: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function mediaTypeForFile(file: File): MediaFileType {
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "image";
  }

  async function uploadFiles(selected: File[]) {
    if (!selected.length) return;
    setUploading(true);
    setError("");
    const uploaded: UploadedFile[] = [];

    try {
      for (const file of selected) {
        if (file.size > 4 * 1024 * 1024) {
          throw new Error(`${file.name} is over 4 MB. Please compress it before uploading.`);
        }
        const form = new FormData();
        form.append("file", file);
        form.append("category", category);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        const item = { name: file.name, url: data.url, mediaType: mediaTypeForFile(file) };
        uploaded.push(item);
        onSingleUploaded?.(item);
      }
      const next = [...files, ...uploaded];
      setFiles(next);
      onUploaded?.(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    await uploadFiles(selected);
    e.target.value = "";
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onUploaded?.(next);
  }

  const isImage = (file: UploadedFile) =>
    file.mediaType === "image" || (!file.mediaType && /\.(jpe?g|png|gif|webp)$/i.test(file.name));
  const isAudio = (file: UploadedFile) =>
    file.mediaType === "audio" || /\.(webm|m4a|mp3|ogg|wav)$/i.test(file.name);

  return (
    <div className="space-y-3">
      {showCameraButtons ? (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => photoInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-[#4C3BCF]/40 hover:bg-[#F4F3FF]/50 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-6 w-6 animate-spin text-[#4C3BCF]" /> : <Camera className="h-6 w-6 text-[#4C3BCF]" />}
            <span className="text-xs font-medium text-slate-600">Take Photo</span>
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => videoInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-[#4C3BCF]/40 hover:bg-[#F4F3FF]/50 transition-colors disabled:opacity-50"
          >
            <Video className="h-6 w-6 text-[#4C3BCF]" />
            <span className="text-xs font-medium text-slate-600">Record Video</span>
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-[#4C3BCF]/40 hover:bg-[#F4F3FF]/50 transition-colors disabled:opacity-50"
          >
            <Upload className="h-6 w-6 text-[#4C3BCF]" />
            <span className="text-xs font-medium text-slate-600">Upload File</span>
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 cursor-pointer hover:border-[#4C3BCF]/40 hover:bg-[#F4F3FF]/50 transition-colors">
          {uploading ? (
            <Loader2 className="h-8 w-8 text-[#4C3BCF] mb-2 animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-slate-300 mb-2" />
          )}
          <span className="text-sm text-slate-500">{uploading ? "Uploading…" : label}</span>
          <span className="text-xs text-slate-400 mt-1">JPG, PNG, MP4 up to 4 MB</span>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            disabled={uploading}
            onChange={handleChange}
          />
        </label>
      )}

      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" disabled={uploading} onChange={handleChange} />
      <input ref={videoInputRef} type="file" accept="video/*" capture="environment" className="hidden" disabled={uploading} onChange={handleChange} />
      {showCameraButtons && (
        <input ref={fileInputRef} type="file" accept={accept} multiple className="hidden" disabled={uploading} onChange={handleChange} />
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {files.map((file, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden bg-slate-100 aspect-square">
              {isImage(file) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
              ) : isAudio(file) ? (
                <div className="flex flex-col items-center justify-center h-full p-2 gap-1">
                  <Mic className="h-6 w-6 text-[#4C3BCF]" />
                  <audio controls src={file.url} className="w-full h-8" preload="metadata" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-2 text-center">
                  <Video className="h-6 w-6 text-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-500 truncate w-full">{file.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center hover:border-[#4C3BCF]/40"
          >
            <ImageIcon className="h-6 w-6 text-slate-300" />
          </button>
        </div>
      )}
    </div>
  );
}
