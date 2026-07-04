"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import type { TrainingSection } from "@/lib/training/training-content";

export function startTrainingTour(section: TrainingSection) {
  if (!section.steps.length) return;

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: "rgba(0,0,0,0.6)",
    steps: section.steps.map((step) => ({
      element: step.element,
      popover: {
        title: step.title,
        description: step.description,
        side: "bottom" as const,
        align: "start" as const,
      },
    })),
    onDestroyed: () => {
      localStorage.setItem(`tour-done-${section.id}`, "1");
    },
  });

  driverObj.drive();
}
