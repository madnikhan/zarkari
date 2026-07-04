"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square, X } from "lucide-react";
import type { UploadedFile } from "@/components/boms/MediaUploadZone";

const MAX_RECORDING_MS = 3 * 60 * 1000;

export type AudioUploadedFile = UploadedFile & { mediaType: "audio" };

interface Props {
  recordings: AudioUploadedFile[];
  onRecorded: (file: AudioUploadedFile) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

function pickMimeType(): string {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "";
}

function extensionForMime(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceNoteRecorder({ recordings, onRecorded, onRemove, disabled = false }: Props) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef("");
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function cleanupStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  }

  async function uploadBlob(blob: Blob, fileName: string) {
    if (blob.size > 4 * 1024 * 1024) {
      throw new Error("Recording is over 4 MB. Please record a shorter note.");
    }
    const form = new FormData();
    form.append("file", blob, fileName);
    form.append("category", "order-voice");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Upload failed");
    return { name: fileName, url: data.url, mediaType: "audio" as const };
  }

  async function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    setRecording(false);
    setUploading(true);
    setError("");

    await new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });

    try {
      const mime = mimeRef.current || recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mime });
      const ext = extensionForMime(mime);
      const fileName = `voice-note-${Date.now()}.${ext}`;
      const file = await uploadBlob(blob, fileName);
      onRecorded(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save voice note");
    } finally {
      chunksRef.current = [];
      setUploading(false);
      setElapsed(0);
      cleanupStream();
    }
  }

  async function startRecording() {
    if (disabled || recording || uploading) return;
    setError("");

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Voice recording is not supported in this browser.");
      return;
    }

    const mime = pickMimeType();
    if (!mime && typeof MediaRecorder === "undefined") {
      setError("Voice recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      mimeRef.current = mime;

      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(250);
      startedAtRef.current = Date.now();
      setRecording(true);
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startedAtRef.current);
      }, 250);

      autoStopRef.current = setTimeout(() => {
        void stopRecording();
      }, MAX_RECORDING_MS);
    } catch {
      cleanupStream();
      setError("Microphone access was denied. Allow the mic in your browser settings to record voice notes.");
    }
  }

  const busy = recording || uploading;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {!recording ? (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => void startRecording()}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#4C3BCF]/40 hover:bg-[#F4F3FF]/50 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#4C3BCF]" />
            ) : (
              <Mic className="h-5 w-5 text-[#4C3BCF]" />
            )}
            <span className="text-sm font-medium text-slate-600">
              {uploading ? "Saving voice note…" : "Record voice note"}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void stopRecording()}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
            </span>
            <Square className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">Stop · {formatElapsed(elapsed)}</span>
          </button>
        )}
        <p className="text-xs text-slate-400">Up to 3 minutes per note</p>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {recordings.length > 0 && (
        <ul className="space-y-2">
          {recordings.map((file, index) => (
            <li key={`${file.url}-${index}`} className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
              <Mic className="h-4 w-4 text-[#4C3BCF] shrink-0" />
              <audio controls src={file.url} className="flex-1 min-w-0 h-9" preload="metadata" />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-1 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50"
                aria-label="Remove voice note"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
