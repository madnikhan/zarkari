import { MEASUREMENT_FIELDS } from "@/lib/sizing";

/** Illustrated head-to-toe measurement guide — numbered markers; labels in figcaption. */
export function MeasurementGuideDiagram({ className }: { className?: string }) {
  return (
    <figure className={className}>
      <svg
        viewBox="0 0 440 720"
        role="img"
        aria-labelledby="measurement-diagram-title"
        className="w-full max-w-md mx-auto"
      >
        <title id="measurement-diagram-title">How to measure for ZARKARI tailoring</title>
        <rect width="440" height="720" fill="#faf8f5" rx="4" />

        <g fill="none" stroke="#1a1814" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="220" cy="72" rx="28" ry="34" fill="#ebe6df" />
          <path d="M208 104 v18 M232 104 v18" />
          <path
            d="M180 122 Q170 180 168 248 L172 380 Q174 420 190 460 L210 520 L230 520 L250 460 Q266 420 268 380 L272 248 Q270 180 260 122 Z"
            fill="#ebe6df"
          />
          <path d="M180 132 Q130 160 108 220 L98 300" />
          <path d="M260 132 Q310 160 332 220 L342 300" />
          <path d="M210 520 L202 640 L198 680 M230 520 L238 640 L242 680" />
        </g>

        <rect x="0" y="0" width="440" height="4" fill="#c9a962" />

        {/* Left markers */}
        <MeasurementMarker x1={48} y1={72} x2={168} y2={72} n={1} />
        <MeasurementMarker x1={48} y1={128} x2={148} y2={128} n={2} />
        <MeasurementMarker x1={48} y1={200} x2={148} y2={200} n={3} />
        <MeasurementMarker x1={48} y1={260} x2={148} y2={260} n={4} />
        <MeasurementMarker x1={48} y1={310} x2={148} y2={310} n={5} />
        {/* Right markers — numbers only to avoid text overlap */}
        <MeasurementMarker x1={340} y1={145} x2={340} y2={195} n={6} vertical />
        <MeasurementMarker x1={360} y1={145} x2={360} y2={295} n={7} vertical />
        <MeasurementMarker x1={340} y1={295} x2={380} y2={295} n={8} />
        <MeasurementMarker x1={300} y1={140} x2={300} y2={500} n={9} vertical />
        <MeasurementMarker x1={320} y1={380} x2={320} y2={680} n={10} vertical />

        <text x="220" y="708" textAnchor="middle" fill="#1a1814" opacity="0.45" fontSize="11" fontFamily="system-ui, sans-serif">
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

function MeasurementMarker({
  x1,
  y1,
  x2,
  y2,
  n,
  vertical,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  n: number;
  vertical?: boolean;
}) {
  const circleX = vertical ? x1 : x1 - 18;
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
    </g>
  );
}
