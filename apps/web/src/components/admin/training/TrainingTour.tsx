"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import type { TrainingSection } from "@/lib/training/training-content";

export function startTrainingTour(section: TrainingSection) {
  if (!section.steps.length) return;

  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const target = section.href.split("?")[0];
  if (path !== target && !path.startsWith(`${target}/`)) {
    const url = new URL(section.href, window.location.origin);
    url.searchParams.set("tour", section.id);
    window.location.assign(url.toString());
    return;
  }

  const steps = section.steps
    .filter((step) => {
      try {
        return Boolean(document.querySelector(step.element));
      } catch {
        return false;
      }
    })
    .map((step) => ({
      element: step.element,
      popover: {
        title: step.title,
        description: step.description,
        side: "bottom" as const,
        align: "start" as const,
      },
    }));

  if (!steps.length) return;

  requestAnimationFrame(() => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: "rgba(0,0,0,0.6)",
      steps,
      onDestroyed: () => {
        localStorage.setItem(`tour-done-${section.id}`, "1");
      },
    });
    driverObj.drive();
  });
}

/** Auto-start a tour when landing with ?tour=sectionId */
export function maybeResumeTrainingTour(sections: TrainingSection[]) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const tourId = params.get("tour");
  if (!tourId) return;
  const section = sections.find((s) => s.id === tourId);
  if (!section) return;
  params.delete("tour");
  const clean = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", clean);
  setTimeout(() => startTrainingTour(section), 400);
}
