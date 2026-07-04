"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import type { Supplier } from "@/lib/data/seed";
import { MediaUploadZone, type UploadedFile } from "@/components/boms/MediaUploadZone";
import { VoiceNoteRecorder, type AudioUploadedFile } from "@/components/boms/VoiceNoteRecorder";
import { whatsAppUrl } from "@/lib/whatsapp";

function defaultDeliveryDate(): string {
  const d = new Date(Date.now() + 56 * 86400000);
  return d.toISOString().slice(0, 10);
}

export function NewOrderForm({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mediaFiles, setMediaFiles] = useState<UploadedFile[]>([]);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    supplierId: suppliers[0]?.id ?? "",
    dressType: "",
    totalPrice: "1000",
    depositPaid: "500",
    deliveryDate: defaultDeliveryDate(),
    customisationNotes: "",
    sendToSupplier: false,
  });

  const remaining = useMemo(() => {
    const total = parseFloat(form.totalPrice) || 0;
    const deposit = parseFloat(form.depositPaid) || 0;
    return Math.max(0, total - deposit).toFixed(2);
  }, [form.totalPrice, form.depositPaid]);

  function setTotalPrice(value: string) {
    const total = parseFloat(value);
    const deposit = !isNaN(total) && total > 0 ? (total * 0.5).toFixed(2) : form.depositPaid;
    setForm((f) => ({ ...f, totalPrice: value, depositPaid: deposit }));
  }

  const waPreview =
    form.customerPhone.trim().length >= 10
      ? whatsAppUrl(form.customerPhone, `Hi ${form.customerName || "there"}, your ZARKARI order will be confirmed shortly.`)
      : null;

  const voiceFiles = mediaFiles.filter((f): f is AudioUploadedFile => f.mediaType === "audio");

  function handleVisualUploaded(files: UploadedFile[]) {
    setMediaFiles((prev) => {
      const voices = prev.filter((f) => f.mediaType === "audio");
      return [...files, ...voices];
    });
  }

  function handleVoiceRecorded(file: AudioUploadedFile) {
    setMediaFiles((prev) => [...prev, file]);
  }

  function handleVoiceRemove(index: number) {
    setMediaFiles((prev) => {
      const voices = prev.filter((f) => f.mediaType === "audio");
      const rest = prev.filter((f) => f.mediaType !== "audio");
      voices.splice(index, 1);
      return [...rest, ...voices];
    });
  }

  function inferMediaType(f: UploadedFile): UploadedFile["mediaType"] {
    if (f.mediaType) return f.mediaType;
    if (/^voice-note-/i.test(f.name) || /\.(m4a|mp3|ogg|wav)$/i.test(f.name)) return "audio";
    if (/\.(mp4|mov)$/i.test(f.name)) return "video";
    return "image";
  }

  function mapMediaCategories(files: UploadedFile[]) {
    let imageCount = 0;
    return files.map((f) => {
      const mediaType = inferMediaType(f);
      if (mediaType === "audio") {
        return { url: f.url, name: f.name, category: "voice" };
      }
      if (mediaType === "video") {
        return { url: f.url, name: f.name, category: "design" };
      }
      const category = imageCount++ === 0 ? "design" : "measurements";
      return { url: f.url, name: f.name, category };
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          depositPaid: form.depositPaid,
          remainingBalance: remaining,
          mediaFiles: mapMediaCategories(mediaFiles),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create order");
      if (data.id) router.push(`/admin/orders/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setLoading(false);
    }
  }

  const field = (key: keyof typeof form, label: string, type = "text", required = false) => (
    <label className="block text-sm">
      <span className="text-slate-500 text-xs uppercase tracking-wide">{label}</span>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5"
        required={required}
      />
    </label>
  );

  return (
    <form onSubmit={submit} className="boms-card p-6 space-y-5">
      {field("customerName", "Customer Name", "text", true)}

      <label className="block text-sm" data-tour="whatsapp-field">
        <span className="text-slate-500 text-xs uppercase tracking-wide">WhatsApp Number</span>
        <input
          type="tel"
          value={form.customerPhone}
          onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
          placeholder="07xxx xxxxxx"
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5"
          required
        />
        {waPreview && (
          <a
            href={waPreview}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:underline"
          >
            <MessageCircle className="h-4 w-4" />
            Test WhatsApp link
          </a>
        )}
      </label>

      <label className="block text-sm">
        <span className="text-slate-500 text-xs uppercase tracking-wide">Supplier</span>
        <select
          value={form.supplierId}
          onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5"
        >
          {suppliers.length === 0 ? (
            <option value="">No suppliers — add one in Suppliers</option>
          ) : (
            suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))
          )}
        </select>
      </label>

      {field("dressType", "Dress Type")}
      <label className="block text-sm">
        <span className="text-slate-500 text-xs uppercase tracking-wide">Total Price (£)</span>
        <input
          type="number"
          value={form.totalPrice}
          onChange={(e) => setTotalPrice(e.target.value)}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5"
          required
        />
      </label>
      <div data-tour="deposit-field">
      {field("depositPaid", "Deposit Paid (£)", "number", true)}
      <label className="block text-sm">
        <span className="text-slate-500 text-xs uppercase tracking-wide">Remaining Balance (£)</span>
        <input
          type="text"
          value={remaining}
          readOnly
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 text-slate-600"
        />
      </label>
      </div>

      {field("deliveryDate", "Delivery Date", "date", true)}

      <label className="block text-sm">
        <span className="text-slate-500 text-xs uppercase tracking-wide">Customisation Notes</span>
        <textarea
          value={form.customisationNotes}
          onChange={(e) => setForm({ ...form, customisationNotes: e.target.value })}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 min-h-[80px]"
        />
      </label>

      <div data-tour="media-upload">
        <span className="text-slate-500 text-xs uppercase tracking-wide">Photos &amp; Videos</span>
        <div className="mt-2">
          <MediaUploadZone
            category="order-design"
            showCameraButtons
            onUploaded={handleVisualUploaded}
          />
        </div>
      </div>

      <div data-tour="voice-upload">
        <span className="text-slate-500 text-xs uppercase tracking-wide">Voice Notes</span>
        <div className="mt-2">
          <VoiceNoteRecorder
            recordings={voiceFiles}
            onRecorded={handleVoiceRecorded}
            onRemove={handleVoiceRemove}
            disabled={loading}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.sendToSupplier}
          onChange={(e) => setForm({ ...form, sendToSupplier: e.target.checked })}
        />
        Save &amp; Send to Supplier
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="boms-btn-primary w-full py-3.5 rounded-lg text-sm font-medium">
        {loading ? "Saving…" : "Create Order"}
      </button>
    </form>
  );
}
