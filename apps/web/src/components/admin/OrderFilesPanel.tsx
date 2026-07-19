"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MediaUploadZone, type UploadedFile } from "@/components/boms/MediaUploadZone";
import { OrderFileGallery } from "@/components/orders/OrderFileGallery";
import { parseJsonResponse } from "@/lib/upload/parse-json";
import type { OrderFile } from "@/lib/data/seed";

type FileCategory = "design" | "measurements" | "voice";

interface Props {
  orderId: string;
  files: OrderFile[];
  canUpload?: boolean;
}

export function OrderFilesPanel({ orderId, files, canUpload = false }: Props) {
  const router = useRouter();
  const [category, setCategory] = useState<FileCategory>("design");
  const [pending, setPending] = useState(0);
  const [error, setError] = useState("");

  async function attachUploaded(uploaded: UploadedFile[]) {
    if (!uploaded.length || !canUpload) return;
    setPending((n) => n + 1);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: uploaded.map((f) => ({
            url: f.url,
            name: f.name,
            category,
          })),
        }),
      });
      const data = await parseJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Failed to attach files");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to attach files");
    } finally {
      setPending((n) => Math.max(0, n - 1));
    }
  }

  return (
    <div className="space-y-5">
      <OrderFileGallery files={files} emptyMessage="No files yet." />

      {canUpload && (
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Add media</h3>
          <p className="text-xs text-slate-500">
            Upload more photos or videos at any stage — design, measurements, or voice notes.
          </p>
          <div>
            <label className="text-xs text-slate-500 uppercase">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FileCategory)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="design">Design</option>
              <option value="measurements">Measurements</option>
              <option value="voice">Voice</option>
            </select>
          </div>
          <MediaUploadZone
            category="order-design"
            showCameraButtons
            label="Upload photos or videos"
            onSingleUploaded={(file) => {
              void attachUploaded([file]);
            }}
          />
          {pending > 0 && <p className="text-xs text-slate-500">Attaching to order…</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
