"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";

interface Props {
  label?: string;
  accept?: string;
  onFilesSelected?: (files: File[]) => void;
}

export function MediaUploadZone({ label = "Upload photos or videos", accept = "image/*,video/*", onFilesSelected }: Props) {
  const [files, setFiles] = useState<File[]>([]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected]);
    onFilesSelected?.(selected);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 cursor-pointer hover:border-[#4C3BCF]/40 hover:bg-[#F4F3FF]/50 transition-colors">
        <Upload className="h-8 w-8 text-slate-300 mb-2" />
        <span className="text-sm text-slate-500">{label}</span>
        <span className="text-xs text-slate-400 mt-1">JPG, PNG, MP4 up to 50MB</span>
        <input type="file" accept={accept} multiple className="hidden" onChange={handleChange} />
      </label>
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li key={i} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
              <span className="truncate">{file.name}</span>
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
