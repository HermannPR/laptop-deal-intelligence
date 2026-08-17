import type { PricePoint } from "@/lib/types";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export function PriceChart({ points }: { points: PricePoint[] }) {
  if (points.length < 2) {
    return <div className="chart-empty">Se necesitan al menos dos observaciones para dibujar la tendencia.</div>;
  }

  const width = 900;
  const height = 280;
  const padding = 28;
  const prices = points.map((point) => point.priceMxn);
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  const range = Math.max(maximum - minimum, maximum * 0.02, 1);
  const timestamps = points.map((point) => Date.parse(point.observedAt));
  const firstTime = Math.min(...timestamps);
  const timeRange = Math.max(Math.max(...timestamps) - firstTime, 1);
  const coordinates = points.map((point, index) => {
    const x = padding + ((timestamps[index] - firstTime) / timeRange) * (width - padding * 2);
    const y = padding + ((maximum - point.priceMxn) / range) * (height - padding * 2);
    return { x, y };
  });
  const line = coordinates.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${padding},${height - padding} ${line} ${width - padding},${height - padding}`;

  return (
    <div className="price-chart">
      <div className="chart-scale"><span>{currency.format(maximum)}</span><span>{currency.format(minimum)}</span></div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Historial de ${points.length} precios observados`}>
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} className="chart-rule" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} className="chart-rule" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="chart-rule" />
        <polygon points={area} className="chart-area" />
        <polyline points={line} className="chart-line" />
        {coordinates.map(({ x, y }, index) => (
          <circle key={`${points[index].observedAt}-${index}`} cx={x} cy={y} r={index === points.length - 1 ? 6 : 3} className={index === points.length - 1 ? "chart-point current" : "chart-point"} />
        ))}
      </svg>
      <div className="chart-dates">
        <span>{new Date(points[0].observedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
        <span>{new Date(points.at(-1)!.observedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
      </div>
    </div>
  );
}
