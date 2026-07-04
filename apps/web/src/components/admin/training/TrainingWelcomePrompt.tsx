"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export function TrainingWelcomePrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("boms-training-welcome-dismissed")) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem("boms-training-welcome-dismissed", "1");
    setShow(false);
  }

  return (
    <div className="bg-[#F4F3FF] border-b border-[#4C3BCF]/20 px-4 py-3 flex items-center gap-3 print:hidden">
      <p className="text-sm text-slate-700 flex-1">
        <strong>New here?</strong> Take a 2-minute tour of the system.{" "}
        <Link href="/admin/training" className="text-[#4C3BCF] font-medium hover:underline">
          Open Training →
        </Link>
      </p>
      <button type="button" onClick={dismiss} aria-label="Dismiss">
        <X className="h-4 w-4 text-slate-400" />
      </button>
    </div>
  );
}
