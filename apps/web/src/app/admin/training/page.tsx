import { TrainingHub } from "@/components/admin/training/TrainingHub";

export default function AdminTrainingPage() {
  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">How to Use BOMS</h1>
      <p className="text-sm text-slate-500 mb-8">
        Simple guides for every section. Tap &quot;Start tour&quot; for a step-by-step walkthrough.
      </p>
      <TrainingHub />
    </div>
  );
}
