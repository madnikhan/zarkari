import { MEASUREMENT_FIELDS } from "@/lib/sizing";

/** Illustrated head-to-toe measurement guide — labels match MEASUREMENT_FIELDS order (1–10). */
export function MeasurementGuideDiagram({ className }: { className?: string }) {
  return (
    <figure className={className}>
      <svg
        viewBox="0 0 520 720"
        role="img"
        aria-labelledby="measurement-diagram-title"
        className="w-full max-w-md mx-auto"
      >
        <title id="measurement-diagram-title">How to measure for ZARKARI tailoring</title>
        <rect width="520" height="720" fill="#faf8f5" rx="4" />

        {/* Figure silhouette — front view */}
        <g fill="none" stroke="#1a1814" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Head */}
          <ellipse cx="260" cy="72" rx="28" ry="34" fill="#ebe6df" />
          {/* Neck */}
          <path d="M248 104 v18 M272 104 v18" />
          {/* Torso */}
          <path
            d="M220 122 Q210 180 208 248 L212 380 Q214 420 230 460 L250 520 L270 520 L290 460 Q306 420 308 380 L312 248 Q310 180 300 122 Z"
            fill="#ebe6df"
          />
          {/* Arms */}
          <path d="M220 132 Q170 160 148 220 L138 300" />
          <path d="M300 132 Q350 160 372 220 L382 300" />
          {/* Legs */}
          <path d="M250 520 L242 640 L238 680 M270 520 L278 640 L282 680" />
        </g>

        {/* Gold accent bar */}
        <rect x="0" y="0" width="520" height="4" fill="#c9a962" />

        {/* Measurement lines + numbered labels */}
        <MeasurementLine x1={60} y1={72} x2={200} y2={72} n={1} label="Neck" />
        <MeasurementLine x1={60} y1={128} x2={175} y2={128} n={2} label="Shoulder" />
        <MeasurementLine x1={60} y1={200} x2={175} y2={200} n={3} label="Bust" />
        <MeasurementLine x1={60} y1={260} x2={175} y2={260} n={4} label="Waist" />
        <MeasurementLine x1={60} y1={310} x2={175} y2={310} n={5} label="Hip" />
        <MeasurementLine x1={400} y1={145} x2={400} y2={195} n={6} label="Armhole" vertical />
        <MeasurementLine x1={430} y1={145} x2={430} y2={295} n={7} label="Sleeve" vertical />
        <MeasurementLine x1={460} y1={295} x2={500} y2={295} n={8} label="Wrist" />
        <MeasurementLine x1={340} y1={140} x2={340} y2={500} n={9} label="Dress length" vertical />
        <MeasurementLine x1={370} y1={380} x2={370} y2={680} n={10} label="Trouser length" vertical />

        <text x="260" y="708" textAnchor="middle" fill="#1a1814" opacity="0.45" fontSize="11" fontFamily="system-ui, sans-serif">
          Stand straight · tape level · measure in inches
        </text>
      </svg>
      <figcaption className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-charcoal/70">
        {MEASUREMENT_FIELDS.map((field, index) => (
          <span key={field.key}>
            <strong className="text-charcoal">{index + 1}.</strong> {field.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

function MeasurementLine({
  x1,
  y1,
  x2,
  y2,
  n,
  label,
  vertical,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  n: number;
  label: string;
  vertical?: boolean;
}) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const labelX = vertical ? x1 + 14 : x1 - 8;
  const labelY = vertical ? midY : y1 - 8;
  const circleX = vertical ? x1 : x1 - 22;
  const circleY = vertical ? y1 - 14 : y1;

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c9a962" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx={circleX} cy={circleY} r="11" fill="#c9a962" />
      <text
        x={circleX}
        y={circleY + 4}
        textAnchor="middle"
        fill="#1a1814"
        fontSize="11"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
      >
        {n}
      </text>
      <text
        x={labelX}
        y={labelY}
        textAnchor={vertical ? "start" : "end"}
        fill="#1a1814"
        fontSize="10"
        fontFamily="system-ui, sans-serif"
        opacity="0.75"
      >
        {label}
      </text>
    </g>
  );
}
