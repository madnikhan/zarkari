export default function OrdersLoading() {
  return (
    <div className="p-4 lg:p-8 animate-pulse">
      <div className="flex justify-between mb-6">
        <div className="h-8 w-32 bg-slate-200 rounded" />
        <div className="h-10 w-28 bg-slate-200 rounded-lg" />
      </div>
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-slate-100 rounded-full" />
        ))}
      </div>
      <div className="boms-card h-96 bg-slate-100" />
    </div>
  );
}
