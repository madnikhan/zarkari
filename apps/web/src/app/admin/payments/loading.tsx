export default function PaymentsLoading() {
  return (
    <div className="p-4 lg:p-8 animate-pulse">
      <div className="h-8 w-36 bg-slate-200 rounded mb-6" />
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="boms-card h-24 bg-slate-100" />
        <div className="boms-card h-24 bg-slate-100" />
      </div>
      <div className="boms-card h-96 bg-slate-100" />
    </div>
  );
}
