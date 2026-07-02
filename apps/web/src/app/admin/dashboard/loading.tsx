export default function DashboardLoading() {
  return (
    <div className="p-4 lg:p-8 animate-pulse">
      <div className="h-8 w-40 bg-slate-200 rounded mb-2" />
      <div className="h-4 w-56 bg-slate-100 rounded mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="boms-card p-5 h-24 bg-slate-100" />
        ))}
      </div>
      <div className="boms-card h-48 bg-slate-100 mb-8" />
      <div className="boms-card h-72 bg-slate-100" />
    </div>
  );
}
