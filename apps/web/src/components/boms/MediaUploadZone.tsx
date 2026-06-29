"use client";

import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface UploadedFile {
  name: string;
  url: string;
}

interface Props {
  label?: string;
  accept?: string;
  category?: string;
  onUploaded?: (files: UploadedFile[]) => void;
}

export function MediaUploadZone({
  label = "Upload photos or videos",
  accept = "image/*,video/*",
  category = "supplier-completion",
  onUploaded,
}: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    setUploading(true);
    setError("");
    const uploaded: UploadedFile[] = [];

    try {
      for (const file of selected) {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            category,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        if (data.uploadUrl && !data.demo) {
          const putRes = await fetch(data.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || data.contentType || "application/octet-stream" },
            body: file,
          });
          if (!putRes.ok) throw new Error("Failed to upload file to storage");
        }
        uploaded.push({ name: file.name, url: data.url });
      }
      const next = [...files, ...uploaded];
      setFiles(next);
      onUploaded?.(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onUploaded?.(next);
  }

  return (
    <div className="space-y-3">
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 cursor-pointer hover:border-[#4C3BCF]/40 hover:bg-[#F4F3FF]/50 transition-colors">
        {uploading ? (
          <Loader2 className="h-8 w-8 text-[#4C3BCF] mb-2 animate-spin" />
        ) : (
          <Upload className="h-8 w-8 text-slate-300 mb-2" />
        )}
        <span className="text-sm text-slate-500">{uploading ? "Uploading…" : label}</span>
        <span className="text-xs text-slate-400 mt-1">JPG, PNG, MP4 up to 50MB</span>
        <input
          type="file"
          accept={accept}
          multiple
          className="hidden"
          disabled={uploading}
          onChange={handleChange}
        />
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li key={i} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
              <a href={file.url} target="_blank" rel="noreferrer" className="truncate text-[#4C3BCF] hover:underline">
                {file.name}
              </a>
              <button type="button" onClick={() => removeFile(i)} aria-label="Remove file">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
