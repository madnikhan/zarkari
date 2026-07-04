"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, ImagePlus, Star, Trash2 } from "lucide-react";
import { MediaPickerModal } from "@/components/admin/content/MediaPickerModal";
import { publicAssetUrl } from "@/lib/image-url";

interface Props {
  images: string[];
  featuredUrl: string;
  onChange: (images: string[], featuredUrl: string) => void;
}

export function ProductImageGallery({ images, featuredUrl, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function addImages(urls: string[]) {
    const merged = [...images];
    for (const url of urls) {
      if (!merged.includes(url)) merged.push(url);
    }
    const featured = featuredUrl || merged[0] || "";
    onChange(merged, featured);
  }

  function removeAt(index: number) {
    const next = images.filter((_, i) => i !== index);
    const removed = images[index];
    let featured = featuredUrl;
    if (removed === featuredUrl) featured = next[0] ?? "";
    onChange(next, featured);
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next, featuredUrl);
  }

  function setFeatured(url: string) {
    onChange(images, url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-slate-500 uppercase">Product images</label>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm text-[#4C3BCF] font-medium hover:underline"
        >
          <ImagePlus className="h-4 w-4" />
          Add images
        </button>
      </div>

      {images.length === 0 ? (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-[#4C3BCF]/40 hover:bg-[#F4F3FF]/30 transition-colors"
        >
          <ImagePlus className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-600 font-medium">No images yet</p>
          <p className="text-xs text-slate-400 mt-1">Upload or choose from media library</p>
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((url, index) => {
            const src = publicAssetUrl(url) ?? url;
            const isFeatured = url === featuredUrl || (!featuredUrl && index === 0);
            return (
              <div key={`${url}-${index}`} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <div className="relative aspect-square">
                  <Image src={src} alt="" fill sizes="160px" className="object-cover" />
                  {isFeatured && (
                    <span className="absolute top-2 left-2 bg-[#4C3BCF] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between p-1.5 bg-white border-t border-slate-100">
                  <button
                    type="button"
                    title="Set as featured"
                    onClick={() => setFeatured(url)}
                    className={`p-1 rounded ${isFeatured ? "text-amber-500" : "text-slate-400 hover:text-amber-500"}`}
                  >
                    <Star className={`h-4 w-4 ${isFeatured ? "fill-current" : ""}`} />
                  </button>
                  <div className="flex gap-0.5">
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="p-1 text-slate-400 disabled:opacity-30">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === images.length - 1}
                      className="p-1 text-slate-400 disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => removeAt(index)} className="p-1 text-red-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => addImages([url])}
        multiple
        onSelectMultiple={addImages}
        title="Add product images"
      />
    </div>
  );
}
