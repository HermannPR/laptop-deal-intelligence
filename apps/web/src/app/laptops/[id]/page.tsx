import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Database, ShieldCheck, TriangleAlert } from "lucide-react";
import { PriceChart } from "@/components/price-chart";
import { getListingDetail } from "@/lib/listings";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export default async function LaptopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getListingDetail(id);
  if (!detail) notFound();

  const { listing, priceHistory, demo } = detail;
  const { assessment, priceStats } = listing;
  const observedDiscount = assessment.observedDiscount30Pct;

  return (
    <main className="detail-page">
      <header className="masthead">
        <Link className="brand" href="/" aria-label="Volver a Precio Justo">
          <span className="brand-mark">PJ</span>
          <span>PRECIO JUSTO</span>
        </Link>
        <div className="market-status"><span /> EXPEDIENTE DE PRECIO</div>
        <div className="edition">ANÁLISIS INDIVIDUAL<br />MERCADO MX</div>
      </header>

      {demo && <div className="demo-banner"><Database size={16} /> VISTA DE DEMOSTRACIÓN · las cifras ilustran el análisis final.</div>}

      <section className="detail-hero">
        <div className="detail-heading">
          <Link className="back-link" href="/"><ArrowLeft size={15} /> VOLVER AL RADAR</Link>
          <div className="detail-kicker"><span>{listing.store}</span><span>{listing.dataProvenance === "google_reported" ? "PRECIO REPORTADO POR GOOGLE" : "LECTURA DIRECTA"}</span></div>
          <h1>{listing.title}</h1>
          <div className="detail-specs">
            <span><small>CPU</small>{listing.cpu ?? "No publicado"}</span>
            <span><small>GPU</small>{listing.gpu ?? "No publicada"}</span>
            <span><small>RAM</small>{listing.ramGb ? `${listing.ramGb} GB` : "Desconocida"}</span>
            <span><small>SSD</small>{listing.storageGb ? `${listing.storageGb} GB` : "Desconocido"}</span>
          </div>
        </div>

        <aside className="verdict-panel">
          <div className="verdict-top"><span>OPORTUNIDAD DE PRECIO</span><b>{assessment.score ?? "—"}<small>/100</small></b></div>
          <strong className={`verdict verdict-${assessment.recommendation.toLowerCase().replaceAll(" ", "-")}`}>{assessment.recommendation}</strong>
          <p>{assessment.score === null ? "Esperando más observaciones antes de emitir una calificación." : assessment.reasons[0]}</p>
          <div className="confidence"><ShieldCheck size={15} /> CONFIANZA {confidenceLabel(assessment.confidence)}</div>
          <a className="offer-button" href={listing.productUrl} target="_blank" rel="noopener noreferrer">ABRIR OFERTA <ArrowUpRight size={17} /></a>
        </aside>
      </section>

      <section className="metric-strip">
        <Metric label="PRECIO ACTUAL" value={currency.format(listing.effectivePriceMxn)} accent />
        <Metric label="PROMEDIO 7 DÍAS" value={formatMoney(priceStats.average7dMxn)} />
        <Metric label="PROMEDIO 30 DÍAS" value={formatMoney(priceStats.average30dMxn)} />
        <Metric label="MÍNIMO OBSERVADO" value={currency.format(priceStats.historicalMinMxn)} />
        <Metric label="MÁXIMO OBSERVADO" value={currency.format(priceStats.historicalMaxMxn)} />
      </section>

      <section className="analysis-grid">
        <article className="history-panel">
          <div className="panel-heading"><div><span>HISTORIAL OBSERVADO</span><h2>La trayectoria, no la etiqueta.</h2></div><b>{priceStats.observationCount} lecturas</b></div>
          <PriceChart points={priceHistory} />
        </article>

        <aside className="evidence-panel">
          <div className="panel-heading"><div><span>EVIDENCIA</span><h2>Por qué.</h2></div></div>
          <ul className="reason-list">
            {assessment.reasons.map((reason, index) => <li key={reason}><b>{String(index + 1).padStart(2, "0")}</b><span>{reason}</span></li>)}
          </ul>
          <dl className="evidence-facts">
            <div><dt>Descuento observado 30d</dt><dd>{observedDiscount === null ? "—" : `${observedDiscount.toFixed(1)}%`}</dd></div>
            <div><dt>Distancia del mínimo</dt><dd>{assessment.distanceFromMinimumPct.toFixed(1)}%</dd></div>
            <div><dt>Cambios de precio</dt><dd>{priceStats.priceChangeCount}</dd></div>
            <div><dt>Días con observaciones</dt><dd>{priceStats.observedDays}</dd></div>
          </dl>
        </aside>
      </section>

      <section className="analysis-caveat">
        <TriangleAlert size={19} />
        <p><b>ALCANCE ACTUAL.</b> Esta puntuación evalúa la oportunidad histórica del precio. La calificación integral de hardware, competidores y rendimiento por peso llegará en el siguiente incremento.</p>
      </section>

      <footer><span>PRECIO JUSTO / MÉXICO</span><p>Una recomendación es evidencia para decidir, no una predicción garantizada.</p><span>{listing.modelNumber ?? "MODELO SIN SKU PUBLICADO"}</span></footer>
    </main>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className={accent ? "metric accent" : "metric"}><span>{label}</span><strong>{value}</strong></div>;
}

function formatMoney(value: number | null): string {
  return value === null ? "—" : currency.format(value);
}

function confidenceLabel(confidence: "insufficient" | "low" | "medium" | "high"): string {
  return { insufficient: "INSUFICIENTE", low: "BAJA", medium: "MEDIA", high: "ALTA" }[confidence];
}
