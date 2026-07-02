export function SampleDataBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-sm text-amber-900 print:hidden">
      <strong>Demo data active.</strong> Sample orders and cash transactions are shown for demonstration. Remove with{" "}
      <code className="text-xs bg-amber-100 px-1.5 py-0.5 rounded">CONFIRM=1 npm run db:clear-sample</code>
    </div>
  );
}
