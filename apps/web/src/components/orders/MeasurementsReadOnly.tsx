import {
  BOTTOM_MEASUREMENT_FIELDS,
  DUPATTA_MEASUREMENT_FIELDS,
  TOP_MEASUREMENT_FIELDS,
  hasAnyMeasurementValue,
  type BridalMeasurements,
} from "@/lib/measurements/bridal-form";

function filledRows(fields: readonly string[], values: Record<string, string>) {
  return fields
    .map((key) => ({ key, value: values[key]?.trim() ?? "" }))
    .filter((r) => r.value);
}

function Section({
  title,
  fields,
  values,
}: {
  title: string;
  fields: readonly string[];
  values: Record<string, string>;
}) {
  const rows = filledRows(fields, values);
  if (!rows.length) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[#4C3BCF] mb-2">{title}</h3>
      <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {rows.map((r) => (
          <div key={`${title}-${r.key}`} className="flex justify-between gap-3 border-b border-slate-50 py-1">
            <dt className="text-slate-500">{r.key}</dt>
            <dd className="font-medium text-slate-900 text-right">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function MeasurementsReadOnly({
  measurements,
  showEmpty = false,
}: {
  measurements?: BridalMeasurements | null;
  showEmpty?: boolean;
}) {
  if (!hasAnyMeasurementValue(measurements)) {
    if (!showEmpty) return null;
    return (
      <section className="boms-card p-4 lg:p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-2">Measurements</h2>
        <p className="text-sm text-slate-500">No measurements entered by the shop yet.</p>
      </section>
    );
  }
  const m = measurements!;

  return (
    <section className="boms-card p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Measurements</h2>
        <span className="text-xs uppercase tracking-wide text-slate-500 bg-slate-100 px-2 py-1 rounded">
          Scale: {m.unit}
        </span>
      </div>
      <Section title="Top" fields={TOP_MEASUREMENT_FIELDS} values={m.top} />
      <Section title="Bottom" fields={BOTTOM_MEASUREMENT_FIELDS} values={m.bottom} />
      <Section title="Dupatta" fields={DUPATTA_MEASUREMENT_FIELDS} values={m.dupatta} />
      {(m.notes?.trim() || m.takenBy?.trim()) && (
        <div className="text-sm space-y-1 pt-2 border-t border-slate-100">
          {m.takenBy?.trim() && (
            <p>
              <span className="text-slate-500">Taken by: </span>
              {m.takenBy}
            </p>
          )}
          {m.notes?.trim() && (
            <p>
              <span className="text-slate-500">Notes: </span>
              {m.notes}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
