"use client";

import { useEffect, useRef } from "react";

function playBeep() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.12;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    osc.onended = () => void ctx.close();
  } catch {
    /* autoplay or Web Audio blocked */
  }
}

/** Beep once when unread count increases — no looping. */
export function useNotificationAlert(unreadCount: number, enabled = true) {
  const prevUnread = useRef(unreadCount);

  useEffect(() => {
    if (!enabled) {
      prevUnread.current = unreadCount;
      return;
    }

    const increased = unreadCount > prevUnread.current && unreadCount > 0;
    prevUnread.current = unreadCount;

    if (increased) {
      playBeep();
    }
  }, [unreadCount, enabled]);
}

export function stopNotificationAlert() {
  /* no-op: alerts are single-shot now */
}
