"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, X, RotateCcw } from "lucide-react";
import type { UploadedFile } from "@/components/boms/MediaUploadZone";
import { AudioPlayer } from "@/components/boms/AudioPlayer";
import { UploadProgressBar } from "@/components/boms/UploadProgressBar";
import {
  extensionForAudioMime,
  normalizeAudioMime,
  pickRecorderMimeType,
  shouldUseTimeslice,
} from "@/lib/audio/mime";
import { uploadBlobWithProgress, type UploadProgressState } from "@/lib/upload/client";

const MAX_RECORDING_MS = 3 * 60 * 1000;

export type AudioUploadedFile = UploadedFile & { mediaType: "audio"; mimeType?: string };

interface PendingRecording {
  id: string;
  name: string;
  localUrl: string;
  blob: Blob;
  mime: string;
  playbackError?: string;
  error?: string;
  uploading?: boolean;
  progress?: UploadProgressState | null;
}

interface Props {
  recordings: AudioUploadedFile[];
  onRecorded: (file: AudioUploadedFile) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function waitForRemoteAudio(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "auto";
    const done = (ok: boolean) => {
      audio.src = "";
      resolve(ok);
    };
    audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) && audio.duration > 0);
    audio.onerror = () => done(false);
    setTimeout(() => done(false), 8000);
    audio.src = url;
  });
}

export function VoiceNoteRecorder({ recordings, onRecorded, onRemove, disabled = false }: Props) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<PendingRecording[]>([]);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef("");
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
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

  function revokeBlobUrl(url: string) {
    if (blobUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
    }
  }

  async function uploadPending(item: PendingRecording) {
    setPending((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, uploading: true, error: undefined, progress: null } : p))
    );
    try {
      const ext = extensionForAudioMime(item.mime);
      const fileName = item.name || `voice-note-${Date.now()}.${ext}`;
      const result = await uploadBlobWithProgress(
        item.blob,
        fileName,
        item.mime,
        "order-voice",
        (state) => {
          setPending((prev) => prev.map((p) => (p.id === item.id ? { ...p, progress: state } : p)));
        },
        item.localUrl
      );

      const remoteOk = result.keepLocal || (await waitForRemoteAudio(result.url));
      const finalUrl = remoteOk ? result.url : item.localUrl;
      const finalMime = result.mimeType ?? item.mime;

      onRecorded({
        name: result.fileName,
        url: finalUrl,
        mediaType: "audio",
        mimeType: finalMime,
      });

      if (remoteOk && finalUrl !== item.localUrl) {
        revokeBlobUrl(item.localUrl);
      }
      setPending((prev) => prev.filter((p) => p.id !== item.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save voice note";
      setPending((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? {
                ...p,
                uploading: false,
                error: message,
                progress: { label: "Upload failed", progress: 0, status: "error", error: message },
              }
            : p
        )
      );
    }
  }

  async function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    setRecording(false);

    if (recorder.state === "recording") {
      try {
        recorder.requestData();
      } catch {
        // ignore — not all browsers support requestData
      }
    }

    await new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });

    const mime = normalizeAudioMime(recorder.mimeType || mimeRef.current || chunksRef.current[0]?.type || "audio/webm");
    const blob = new Blob(chunksRef.current, { type: mime });
    chunksRef.current = [];
    cleanupStream();
    setElapsed(0);

    if (blob.size === 0) {
      setError("Recording was empty — try again.");
      return;
    }

    const ext = extensionForAudioMime(mime);
    const localUrl = URL.createObjectURL(blob);
    blobUrlsRef.current.add(localUrl);
    const item: PendingRecording = {
      id: `pending-${Date.now()}`,
      name: `voice-note-${Date.now()}.${ext}`,
      localUrl,
      blob,
      mime,
    };
    setPending((prev) => [...prev, item]);
    void uploadPending(item);
  }

  async function startRecording() {
    if (disabled || recording) return;
    setError("");

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Voice recording is not supported in this browser.");
      return;
    }

    const mime = pickRecorderMimeType();
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

      const encodedMime = normalizeAudioMime(recorder.mimeType || mime);
      if (shouldUseTimeslice(encodedMime)) {
        recorder.start(250);
      } else {
        recorder.start();
      }

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

  function removePending(id: string) {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) revokeBlobUrl(item.localUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  const busy = recording || pending.some((p) => p.uploading);

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
            <Mic className="h-5 w-5 text-[#4C3BCF]" />
            <span className="text-sm font-medium text-slate-600">Record voice note</span>
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

      {pending.map((item) => (
        <div key={item.id} className="space-y-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-[#4C3BCF] shrink-0" />
            <AudioPlayer src={item.localUrl} mimeType={item.mime} className="flex-1 min-w-0 h-9" />
            {!item.uploading && (
              <button
                type="button"
                onClick={() => removePending(item.id)}
                className="p-1 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50"
                aria-label="Remove voice note"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <UploadProgressBar state={item.progress ?? null} />
          {item.error && !item.uploading && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-red-600 flex-1">{item.error}</p>
              <button
                type="button"
                onClick={() => void uploadPending(item)}
                className="inline-flex items-center gap-1 text-xs text-[#4C3BCF] hover:underline"
              >
                <RotateCcw className="h-3 w-3" />
                Retry upload
              </button>
            </div>
          )}
        </div>
      ))}

      {recordings.length > 0 && (
        <ul className="space-y-2">
          {recordings.map((file, index) => (
            <li
              key={`${file.url}-${index}`}
              className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50"
            >
              <Mic className="h-4 w-4 text-[#4C3BCF] shrink-0" />
              <AudioPlayer
                src={file.url}
                mimeType={file.mimeType ?? (file.name.endsWith(".m4a") ? "audio/mp4" : "audio/webm")}
                className="flex-1 min-w-0 h-9"
                label={file.name}
              />
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
