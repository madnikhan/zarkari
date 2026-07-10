"use client";

import type { CustomerMessage } from "@/lib/data/seed";
import { publicAssetUrl } from "@/lib/image-url";
import { getMediaKind } from "@/lib/upload/mime";

export function MessageStatusBadge({ message }: { message: CustomerMessage }) {
  if (message.senderType !== "staff") return null;
  if (message.readAt) {
    return <span className="text-[10px] text-emerald-600 font-medium">Seen</span>;
  }
  return <span className="text-[10px] text-slate-400">Sent</span>;
}

export function MessageAttachment({ message }: { message: CustomerMessage }) {
  if (!message.attachmentUrl) return null;
  const src = publicAssetUrl(message.attachmentUrl) ?? message.attachmentUrl;
  const kind =
    message.attachmentKind === "video" ||
    message.attachmentKind === "audio" ||
    message.attachmentKind === "image"
      ? message.attachmentKind
      : getMediaKind(message.attachmentUrl.split("/").pop() ?? "file.jpg", message.attachmentKind);

  if (kind === "video") {
    return (
      <video src={src} controls playsInline className="mt-2 w-full max-h-48 rounded-lg bg-black" />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Order update" className="mt-2 w-full max-h-48 object-cover rounded-lg" />
  );
}
