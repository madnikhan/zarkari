export interface HeroVideoClip {
  url: string;
  poster?: string;
}

export interface HeroVideo {
  id: string;
  src: string;
  poster?: string;
  /** Approximate duration in seconds (used before metadata loads). */
  durationSec?: number;
}

const HERO_R2_PREFIX = "uploads/hero/";

function isValidMediaUrl(url: string): boolean {
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/")
  );
}

/** True when URL points at an object under uploads/hero/ in R2 (or local /videos/hero/). */
export function isHeroMediaUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/videos/hero/")) return true;
  try {
    const path = new URL(trimmed, "https://placeholder.local").pathname.replace(/^\//, "");
    return path.startsWith(HERO_R2_PREFIX);
  } catch {
    return false;
  }
}

export function filterHeroMediaClips(clips: HeroVideoClip[]): HeroVideoClip[] {
  return clips.filter((clip) => isHeroMediaUrl(clip.url));
}

export function parseHeroVideos(raw: string | undefined): HeroVideo[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const out: HeroVideo[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i] as { url?: unknown; poster?: unknown };
      const url = typeof item?.url === "string" ? item.url.trim() : "";
      if (!url || !isValidMediaUrl(url) || !isHeroMediaUrl(url)) continue;

      const poster =
        typeof item?.poster === "string" && item.poster.trim()
          ? item.poster.trim()
          : undefined;

      out.push({
        id: String(out.length + 1).padStart(2, "0"),
        src: url,
        poster,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function serializeHeroVideos(clips: HeroVideoClip[]): string {
  return JSON.stringify(
    filterHeroMediaClips(clips)
      .map((clip) => ({
        url: clip.url.trim(),
        ...(clip.poster?.trim() ? { poster: clip.poster.trim() } : {}),
      }))
      .filter((clip) => clip.url)
  );
}

export function heroClipLabel(url: string): string {
  try {
    const path = new URL(url, "https://placeholder.local").pathname;
    const name = path.split("/").pop();
    return name || url;
  } catch {
    return url;
  }
}
