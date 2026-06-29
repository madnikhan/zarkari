import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "./types";

export function resolveInboxFilter(searchParams: {
  platform?: string;
  unread?: string;
}): { key: string; platform?: SocialPlatform; unreadOnly?: boolean } {
  if (searchParams.unread === "1") return { key: "unread", unreadOnly: true };
  const platform = searchParams.platform as SocialPlatform | undefined;
  if (platform && platform in SOCIAL_PLATFORM_LABELS) {
    return { key: platform, platform };
  }
  return { key: "all" };
}
