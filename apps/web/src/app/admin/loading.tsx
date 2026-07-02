export default function AdminLoading() {
  return (
    <div className="p-4 lg:p-8 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="boms-card p-5 h-24 bg-slate-100" />
        ))}
      </div>
      <div className="boms-card h-64 bg-slate-100" />
    </div>
  );
}
