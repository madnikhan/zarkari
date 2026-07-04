"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, PlayCircle, Search } from "lucide-react";
import { TRAINING_FAQ, TRAINING_SECTIONS } from "@/lib/training/training-content";
import { startTrainingTour } from "@/components/admin/training/TrainingTour";

export function TrainingHub() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return TRAINING_SECTIONS;
    return TRAINING_SECTIONS.filter(
      (s) => s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredFaq = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return TRAINING_FAQ;
    return TRAINING_FAQ.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="space-y-8">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search guides…"
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((section) => {
          return (
            <div key={section.id} className="boms-card p-5 flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <BookOpen className="h-5 w-5 text-[#4C3BCF] flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-slate-900">{section.title}</h2>
                </div>
              </div>
              <p className="text-sm text-slate-600 flex-1 mb-4">{section.summary}</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={section.href}
                  className="text-xs text-[#4C3BCF] hover:underline font-medium"
                >
                  Open section →
                </Link>
                {section.steps.length > 0 && (
                  <button
                    type="button"
                    onClick={() => startTrainingTour(section)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-white bg-[#4C3BCF] px-3 py-1.5 rounded-lg hover:bg-[#3d2fb8]"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    Start tour
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Common questions</h2>
        <div className="space-y-3">
          {filteredFaq.map((item) => (
            <details key={item.q} className="boms-card p-4 group">
              <summary className="font-medium text-slate-900 cursor-pointer list-none flex justify-between">
                {item.q}
                <span className="text-slate-400 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
