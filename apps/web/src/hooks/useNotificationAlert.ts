"use client";

import { useEffect, useRef } from "react";

let alertInterval: ReturnType<typeof setInterval> | null = null;

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

function startAlertLoop() {
  if (alertInterval) return;
  playBeep();
  alertInterval = setInterval(playBeep, 2000);
}

function stopAlertLoop() {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
  }
}

export function useNotificationAlert(unreadCount: number, enabled = true) {
  const prevUnread = useRef(unreadCount);
  const playing = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const increased = unreadCount > prevUnread.current && unreadCount > 0;
    prevUnread.current = unreadCount;

    if (increased && !playing.current) {
      playing.current = true;
      startAlertLoop();
    }

    if (unreadCount === 0 && playing.current) {
      stopAlertLoop();
      playing.current = false;
    }
  }, [unreadCount, enabled]);

  useEffect(() => {
    return () => {
      if (playing.current) {
        stopAlertLoop();
        playing.current = false;
      }
    };
  }, []);
}

export function stopNotificationAlert() {
  stopAlertLoop();
}
