export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "whatsapp"
  | "tiktok"
  | "pinterest"
  | "email"
  | "walkin"
  | "other";

export type SocialThreadStatus = "open" | "replied" | "closed";

export type SocialMessageDirection = "inbound" | "outbound";

export interface SocialThread {
  id: string;
  platform: SocialPlatform;
  externalThreadId?: string | null;
  contactName?: string | null;
  contactHandle?: string | null;
  contactPhone?: string | null;
  subject?: string | null;
  status: SocialThreadStatus;
  unreadCount: number;
  lastMessageAt: string;
  lastMessagePreview?: string | null;
  assignedToUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SocialMessage {
  id: string;
  threadId: string;
  direction: SocialMessageDirection;
  body: string;
  externalMessageId?: string | null;
  sentByUserId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface SocialInboxStats {
  totalUnread: number;
  byPlatform: Record<SocialPlatform, number>;
}

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  email: "Email",
  walkin: "Walk-in",
  other: "Other",
};

export const MANUAL_PLATFORMS: SocialPlatform[] = [
  "tiktok",
  "pinterest",
  "email",
  "walkin",
  "other",
];

export function isManualPlatform(platform: SocialPlatform): boolean {
  return MANUAL_PLATFORMS.includes(platform);
}
