import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Database, ExternalLink, ShieldCheck, TriangleAlert } from "lucide-react";
import { PriceChart } from "@/components/price-chart";
import { getListingDetail } from "@/lib/listings";
import type { Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export default async function LaptopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getListingDetail(id);
  if (!detail) notFound();

  const { listing, priceHistory, alternatives, demo } = detail;
  const { assessment, priceStats, hardwareValue } = listing;
  const coverageDays = Math.max(1, Math.ceil(priceStats.historySpanDays));

  return (
    <main className="app-shell detail-page">
      <header className="app-header">
        <Link className="product-name" href="/" aria-label="Volver a LapIntel MX">
          <span className="product-mark">L</span><span>LapIntel MX</span><small>análisis</small>
        </Link>
        <div className="header-status"><span className={listing.freshness.isStale ? "status-dot stale" : "status-dot"} /><span>{listing.freshness.isStale ? "precio vencido" : "precio vigente"}</span><time>{formatDate(listing.observedAt)}</time></div>
      </header>

      {demo && <div className="system-notice"><Database size={14} /> Datos de demostración.</div>}
      {listing.freshness.isStale && <div className="system-notice warning"><TriangleAlert size={14} /> Esta lectura superó las {listing.freshness.staleAfterHours} horas permitidas. Confirma el precio en la tienda.</div>}

      <nav className="detail-nav"><Link href="/"><ArrowLeft size={14} /> Volver a resultados</Link><span>{listing.store} / {listing.modelNumber ?? "SKU no publicado"}</span></nav>

      <section className="detail-summary">
        <div className="detail-identity">
          <div className="source-line"><b>{listing.store}</b><span>{listing.dataProvenance === "google_reported" ? "precio reportado por Google" : "lectura directa"}</span></div>
          <h1>{listing.title}</h1>
          <dl className="spec-grid">
            <Spec label="CPU" value={listing.cpu} />
            <Spec label="GPU" value={listing.gpu} />
            <Spec label="RAM" value={listing.ramGb ? `${listing.ramGb} GB` : null} />
            <Spec label="SSD" value={listing.storageGb ? `${listing.storageGb} GB` : null} />
            <Spec label="Pantalla" value={listing.screen} />
          </dl>
        </div>

        <aside className="decision-card">
          <span className="decision-label">Precio efectivo</span>
          <strong className="decision-price">{currency.format(listing.effectivePriceMxn)}</strong>
          <small>{listing.shippingMxn ? `incluye ${currency.format(listing.shippingMxn)} de envío` : "envío incluido o no reportado"}</small>
          <div className="decision-scores">
            <ScoreBlock label="Oportunidad de precio" value={assessment.score === null ? "—" : String(assessment.score)} suffix="/100" detail={`confianza ${confidenceLabel(assessment.confidence)}`} />
            <ScoreBlock label="Bang for Buck GPU" value={hardwareValue.gpuPointsPer1000Mxn?.toFixed(1) ?? "—"} suffix="pts/$1k" detail={hardwareValue.gpuBenchmarkName ?? "sin benchmark"} />
          </div>
          <div className={`recommendation recommendation-${assessment.recommendation.toLowerCase().replaceAll(" ", "-")}`}><span>Recomendación de precio</span><b>{assessment.recommendation}</b></div>
          <a className="primary-offer" href={listing.productUrl} target="_blank" rel="noopener noreferrer">Abrir oferta <ArrowUpRight size={16} /></a>
        </aside>
      </section>

      <section className="metric-strip compact">
        <Metric label="Promedio 7 días" value={formatMoney(priceStats.average7dMxn)} />
        <Metric label={`Promedio disponible (${coverageDays} d)`} value={formatMoney(priceStats.average30dMxn)} />
        <Metric label="Mínimo observado" value={currency.format(priceStats.historicalMinMxn)} />
        <Metric label="Máximo observado" value={currency.format(priceStats.historicalMaxMxn)} />
        <Metric label="Lecturas / cambios" value={`${priceStats.observationCount} / ${priceStats.priceChangeCount}`} />
      </section>

      <section className="analysis-grid">
        <article className="panel history-panel">
          <div className="panel-heading"><div><span>HISTORIAL OBSERVADO</span><h2>Precio a través del tiempo</h2></div><b>{coverageDays} días de cobertura</b></div>
          <PriceChart points={priceHistory} />
          {coverageDays < 30 && <p className="coverage-note"><TriangleAlert size={15} /> “Promedio disponible” usa solamente {coverageDays} días; todavía no representa 30 días completos.</p>}
        </article>

        <aside className="panel evidence-panel">
          <div className="panel-heading"><div><span>EVIDENCIA DE PRECIO</span><h2>Cómo se llegó al resultado</h2></div></div>
          <ul className="reason-list">{assessment.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          <dl className="facts-list">
            <Fact label="Vs. promedio disponible" value={assessment.observedDiscount30Pct === null ? "—" : `${assessment.observedDiscount30Pct.toFixed(1)}%`} />
            <Fact label="Sobre el mínimo" value={`${assessment.distanceFromMinimumPct.toFixed(1)}%`} />
            <Fact label="Confianza" value={confidenceLabel(assessment.confidence)} />
            <Fact label="Vigencia permitida" value={`${listing.freshness.staleAfterHours} h`} />
          </dl>
        </aside>
      </section>

      <section className="value-method panel">
        <div className="panel-heading"><div><span>RENDIMIENTO / PRECIO</span><h2>Qué significa Bang for Buck</h2></div></div>
        <div className="value-explainer">
          <div><strong>{hardwareValue.gpuBenchmarkScore?.toLocaleString("es-MX") ?? "—"}</strong><span>puntos GPU de referencia</span></div>
          <div className="formula">÷</div>
          <div><strong>{currency.format(listing.effectivePriceMxn / 1000)}</strong><span>miles de MXN</span></div>
          <div className="formula">=</div>
          <div className="result"><strong>{hardwareValue.gpuPointsPer1000Mxn?.toFixed(1) ?? "—"}</strong><span>puntos por $1,000 MXN</span></div>
          <p>Compara rendimiento gráfico de referencia por precio efectivo. No incluye CPU, pantalla, batería, construcción ni diferencias de TGP y enfriamiento entre laptops.</p>
          {hardwareValue.gpuBenchmarkSourceUrl && <a href={hardwareValue.gpuBenchmarkSourceUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Fuente: {hardwareValue.gpuBenchmarkSource}</a>}
        </div>
      </section>

      <section className="alternatives-panel panel">
        <div className="panel-heading"><div><span>COMPETIDORES CERCANOS</span><h2>Alternativas dentro de ±20% del precio</h2></div><b>{alternatives.length} vigentes</b></div>
        {alternatives.length ? <div className="alternatives-table">{alternatives.map((item) => <Alternative key={item.id} listing={item} />)}</div> : <div className="empty-state"><strong>Sin alternativas vigentes</strong><span>No se encontraron listados comparables en esta banda de precio.</span></div>}
      </section>

      <section className="analysis-caveat"><ShieldCheck size={17} /><p>La recomendación BUY/WAIT evalúa únicamente el momento del precio con la historia disponible. Bang for Buck es una señal GPU/precio independiente; ninguna de las dos predice con certeza precios futuros.</p></section>

      <footer className="app-footer"><span>Verifica disponibilidad, vendedor, garantía y total antes de comprar.</span><span>LapIntel MX · decisión basada en evidencia observada</span></footer>
    </main>
  );
}

function Spec({ label, value }: { label: string; value: string | null }) { return <div><dt>{label}</dt><dd>{value ?? "No publicado"}</dd></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div>; }
function Fact({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
function ScoreBlock({ label, value, suffix, detail }: { label: string; value: string; suffix: string; detail: string }) { return <div><span>{label}</span><b>{value}<small>{suffix}</small></b><em>{detail}</em></div>; }

function Alternative({ listing }: { listing: Listing }) {
  return <article><div><b>{listing.gpu ?? "GPU desconocida"}</b><h3>{listing.title}</h3><span>{listing.store}</span></div><div><strong>{currency.format(listing.effectivePriceMxn)}</strong><span>{listing.hardwareValue.gpuPointsPer1000Mxn?.toFixed(1) ?? "—"} pts/$1k</span></div><div><span>Precio {listing.assessment.score ?? "—"}/100</span><Link href={`/laptops/${listing.id}`}>Comparar <ArrowUpRight size={13} /></Link></div></article>;
}

function formatMoney(value: number | null): string { return value === null ? "—" : currency.format(value); }
function formatDate(value: string): string { return new Date(value).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }); }
function confidenceLabel(value: Listing["assessment"]["confidence"]): string { return { insufficient: "insuficiente", low: "baja", medium: "media", high: "alta" }[value]; }
