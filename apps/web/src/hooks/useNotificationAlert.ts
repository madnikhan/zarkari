"use client";

import { useEffect, useRef } from "react";

let sharedAudio: HTMLAudioElement | null = null;

function getAlertAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudio) {
    sharedAudio = new Audio("/audio/sample-voice.webm");
    sharedAudio.loop = true;
    sharedAudio.volume = 0.6;
  }
  return sharedAudio;
}

export function useNotificationAlert(unreadCount: number, enabled = true) {
  const prevUnread = useRef(unreadCount);
  const playing = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const audio = getAlertAudio();
    if (!audio) return;

    const increased = unreadCount > prevUnread.current && unreadCount > 0;
    prevUnread.current = unreadCount;

    if (increased && !playing.current) {
      playing.current = true;
      audio.play().catch(() => {
        playing.current = false;
      });
    }

    if (unreadCount === 0 && playing.current) {
      audio.pause();
      audio.currentTime = 0;
      playing.current = false;
    }
  }, [unreadCount, enabled]);

  useEffect(() => {
    return () => {
      const audio = getAlertAudio();
      if (audio && playing.current) {
        audio.pause();
        audio.currentTime = 0;
        playing.current = false;
      }
    };
  }, []);
}

export function stopNotificationAlert() {
  const audio = getAlertAudio();
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}
