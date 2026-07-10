"use client";

import Link from "next/link";
import { ChevronDown, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ZarkariLogo } from "@/components/brand/ZarkariLogo";
import type { HeroVideo } from "@/lib/data/hero-videos";
import { cn } from "@/lib/utils";

const MIN_CLIP_MS = 10000;

interface VideoHeroCarouselProps {
  videos: HeroVideo[];
  tagline: string;
  headline?: string;
}

export function VideoHeroCarousel({ videos, tagline, headline }: VideoHeroCarouselProps) {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [frontSlot, setFrontSlot] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(true);
  const [clipDurations, setClipDurations] = useState<number[]>(() =>
    videos.map((v) => v.durationSec ?? 15)
  );
  const slotIndexes = useRef<[number, number]>([0, 0]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null]);
  const sectionRef = useRef<HTMLElement>(null);
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  const hasVideos = videos.length > 0;
  const showCarouselDots = videos.length > 1;
  const safeIndex = hasVideos ? activeIndex % videos.length : 0;
  const current = hasVideos ? videos[safeIndex] : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setClipDurations(videos.map((v) => v.durationSec ?? 15));
    setActiveIndex(0);
    setFrontSlot(0);
    slotIndexes.current = [0, 0];
  }, [videos]);

  useEffect(() => {
    if (activeIndex >= videos.length && videos.length > 0) {
      setActiveIndex(0);
    }
  }, [activeIndex, videos.length]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const playSlot = useCallback(
    async (slot: number, index: number) => {
      const video = videoRefs.current[slot];
      const clip = videos[index];
      if (!video || !clip || reducedMotion) return;
      video.loop = true;
      video.muted = true;
      slotIndexes.current[slot] = index;
      video.src = clip.src;
      video.load();
      try {
        await video.play();
      } catch {
        /* autoplay blocked */
      }
    },
    [reducedMotion, videos]
  );

  const advanceToNext = useCallback(
    (fromIndex: number) => {
      if (videos.length <= 1) return;
      const nextIndex = (fromIndex + 1) % videos.length;
      const backSlot = 1 - frontSlot;
      playSlot(backSlot, nextIndex).then(() => {
        setFrontSlot(backSlot);
        setActiveIndex(nextIndex);
      });
    },
    [frontSlot, playSlot, videos.length]
  );

  const registerDuration = useCallback((index: number, seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    setClipDurations((prev) => {
      if (prev[index] === seconds) return prev;
      const next = [...prev];
      next[index] = seconds;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!mounted || reducedMotion || !hasVideos) return;
    playSlot(frontSlot, safeIndex);
  }, [safeIndex, frontSlot, mounted, playSlot, reducedMotion, hasVideos]);

  useEffect(() => {
    if (!mounted || reducedMotion || !visible || videos.length <= 1) return;

    const holdMs = Math.max((clipDurations[safeIndex] ?? 15) * 1000, MIN_CLIP_MS);
    const timer = setTimeout(() => {
      advanceToNext(safeIndex);
    }, holdMs);

    return () => clearTimeout(timer);
  }, [
    safeIndex,
    clipDurations,
    mounted,
    advanceToNext,
    reducedMotion,
    visible,
    videos.length,
  ]);

  useEffect(() => {
    if (!mounted || reducedMotion || !visible || !hasVideos) {
      videoRefs.current.forEach((v) => v?.pause());
      return;
    }
    const front = videoRefs.current[frontSlot];
    if (front) {
      front.loop = true;
      front.play().catch(() => {});
    }
  }, [visible, frontSlot, mounted, reducedMotion, hasVideos]);

  const showVideo = mounted && !reducedMotion && hasVideos;

  return (
    <section
      ref={sectionRef}
      aria-label="ZARKARI collection showcase"
      className="relative min-h-[90vh] w-full overflow-hidden bg-charcoal"
    >
      {current?.poster && (
        <div
          className="absolute inset-0 bg-cover bg-center hero-ken-burns"
          style={{ backgroundImage: `url(${current.poster})` }}
          role="img"
          aria-label="ZARKARI collection"
        />
      )}

      {showVideo && (
        <>
          {[0, 1].map((slot) => (
            <video
              key={slot}
              ref={(el) => {
                videoRefs.current[slot] = el;
              }}
              className={cn(
                "hero-video absolute inset-0 h-full w-full object-cover hero-ken-burns",
                slot === frontSlot ? "hero-video-active" : "hero-video-inactive"
              )}
              muted
              loop
              playsInline
              autoPlay={slot === frontSlot}
              preload={slot === frontSlot ? "auto" : "metadata"}
              poster={current?.poster}
              aria-hidden
              suppressHydrationWarning
              onLoadedMetadata={(e) => {
                registerDuration(slotIndexes.current[slot], e.currentTarget.duration);
              }}
              onCanPlay={(e) => {
                if (slot === frontSlot && visible) {
                  e.currentTarget.play().catch(() => {});
                }
              }}
              onError={() => {
                if (slot === frontSlot) {
                  advanceToNext(slotIndexes.current[slot]);
                }
              }}
            />
          ))}
        </>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/25 to-charcoal/10" />

      <div className="relative z-10 flex min-h-[90vh] flex-col justify-end px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          {headline ? (
            <h1 className="font-display text-4xl md:text-6xl text-cream mb-4 tracking-wide">{headline}</h1>
          ) : (
            <ZarkariLogo size="lg" variant="light" className="mb-4" />
          )}
          <p className="mb-8 max-w-md text-sm leading-relaxed text-cream/80 md:text-base">{tagline}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="#catalogue"
              className="inline-flex items-center justify-center bg-gold px-8 py-4 text-xs tracking-[0.2em] uppercase text-charcoal transition-colors hover:bg-cream"
            >
              Shop Catalogue
            </Link>
            {whatsapp && (
              <Link
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-cream/40 px-8 py-4 text-xs tracking-[0.2em] uppercase text-cream transition-colors hover:bg-cream/10"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Link>
            )}
          </div>
        </div>
      </div>

      {showCarouselDots && (
        <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {videos.map((clip, i) => (
            <button
              key={clip.id}
              type="button"
              aria-label={`Show clip ${i + 1}`}
              onClick={() => {
                if (i === safeIndex) return;
                const backSlot = 1 - frontSlot;
                playSlot(backSlot, i).then(() => {
                  setFrontSlot(backSlot);
                  setActiveIndex(i);
                });
              }}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i === safeIndex ? "w-8 bg-gold" : "w-4 bg-cream/30 hover:bg-cream/50"
              )}
            />
          ))}
        </div>
      )}

      <a
        href="#catalogue"
        aria-label="Scroll to catalogue"
        className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 text-cream/50 transition-colors hover:text-cream"
      >
        <ChevronDown className="h-5 w-5 animate-bounce" />
      </a>
    </section>
  );
}
