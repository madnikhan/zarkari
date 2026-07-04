"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon, Link2, Trash2, Upload } from "lucide-react";
import { MediaPickerModal } from "@/components/admin/content/MediaPickerModal";
import { publicAssetUrl } from "@/lib/image-url";

interface Props {
  label?: string;
  value: string;
  onChange: (url: string) => void;
}

export function ImageField({ label = "Image", value, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const src = value ? (publicAssetUrl(value) ?? value) : null;

  return (
    <div>
      <label className="text-xs text-slate-500 uppercase block mb-2">{label}</label>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="relative w-full sm:w-32 h-32 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex-shrink-0">
          {src ? (
            <Image src={src} alt="" fill sizes="128px" className="object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <ImageIcon className="h-8 w-8 mb-1" />
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2 w-full">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#4C3BCF] text-white hover:bg-[#3d2fb8]"
          >
            <Upload className="h-4 w-4" />
            Upload / Select from library
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowUrl(!showUrl)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#4C3BCF]"
          >
            <Link2 className="h-3.5 w-3.5" />
            {showUrl ? "Hide URL field" : "Paste URL instead"}
          </button>
          {showUrl && (
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-xs"
            />
          )}
        </div>
      </div>
      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => onChange(url)}
        title={`Select ${label.toLowerCase()}`}
      />
    </div>
  );
}
