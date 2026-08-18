"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Database, Search, SlidersHorizontal } from "lucide-react";
import { filterListings } from "@/lib/filter-listings";
import type { Listing, ListingFilters } from "@/lib/types";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

const initialFilters: ListingFilters = {
  query: "",
  maxPrice: 60000,
  store: "",
  gpu: "",
  minRam: 0,
  includeStale: false,
  sort: "bang",
};

export function Dashboard({ initialListings, demo }: { initialListings: Listing[]; demo: boolean }) {
  const [filters, setFilters] = useState(initialFilters);
  const listings = useMemo(() => filterListings(initialListings, filters), [initialListings, filters]);
  const stores = [...new Set(initialListings.map((item) => item.store))].sort();
  const staleCount = initialListings.filter((item) => item.freshness.isStale).length;
  const scoredCount = initialListings.filter((item) => item.assessment.score !== null).length;
  const benchmarkedCount = initialListings.filter(
    (item) => item.hardwareValue.gpuPointsPer1000Mxn !== null,
  ).length;
  const newest = initialListings.reduce(
    (latest, item) => (Date.parse(item.observedAt) > Date.parse(latest) ? item.observedAt : latest),
    initialListings[0]?.observedAt ?? new Date().toISOString(),
  );

  const update = <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="product-name" href="#results" aria-label="LapIntel MX, inicio">
          <span className="product-mark">L</span>
          <span>LapIntel MX</span>
          <small>monitor personal</small>
        </a>
        <div className="header-status">
          <span className="status-dot" />
          <span>{demo ? "datos de demostración" : "monitor activo"}</span>
          <time>{formatDate(newest)}</time>
        </div>
      </header>

      {demo && (
        <div className="system-notice">
          <Database size={14} /> Datos de demostración: conecta Supabase para usar observaciones reales.
        </div>
      )}

      <section className="summary-strip" aria-label="Resumen del monitor">
        <Summary label="Listados" value={initialListings.length} detail="activos y vencidos" />
        <Summary label="Con historial" value={scoredCount} detail="precio calificable" />
        <Summary label="Con benchmark" value={benchmarkedCount} detail="GPU normalizada" />
        <Summary label="Vencidos ocultos" value={staleCount} detail="por defecto" warning={staleCount > 0} />
      </section>

      <section className="control-panel" aria-label="Filtros de búsqueda">
        <label className="search-control">
          <Search size={16} />
          <input
            value={filters.query}
            onChange={(event) => update("query", event.target.value)}
            placeholder="Buscar modelo, CPU, GPU o SKU"
          />
        </label>
        <FilterSelect label="Tienda" value={filters.store} onChange={(value) => update("store", value)} options={stores} empty="Todas" />
        <FilterSelect label="GPU" value={filters.gpu} onChange={(value) => update("gpu", value)} options={["RTX 3050", "RTX 4050", "RTX 4060", "RTX 5050", "RTX 5060", "RTX 5070"]} empty="Todas" />
        <FilterSelect label="RAM mínima" value={String(filters.minRam)} onChange={(value) => update("minRam", Number(value))} options={["16", "24", "32"]} empty="Cualquiera" suffix=" GB" />
        <label className="budget-control">
          <span>Precio máximo</span>
          <input type="number" min="5000" step="1000" value={filters.maxPrice} onChange={(event) => update("maxPrice", Number(event.target.value))} />
          <b>MXN</b>
        </label>
        <button className="clear-button" onClick={() => setFilters(initialFilters)}><SlidersHorizontal size={14} /> Limpiar</button>
      </section>

      <section className="results-panel" id="results">
        <div className="results-toolbar">
          <div>
            <h1>Oportunidades actuales</h1>
            <p>{listings.length} resultados · precio efectivo en MXN</p>
          </div>
          <div className="toolbar-controls">
            <label className="stale-toggle">
              <input type="checkbox" checked={filters.includeStale} onChange={(event) => update("includeStale", event.target.checked)} />
              Incluir vencidos ({staleCount})
            </label>
            <label className="sort-control">
              <span>Orden</span>
              <select value={filters.sort} onChange={(event) => update("sort", event.target.value as ListingFilters["sort"])}>
                <option value="bang">Bang for Buck GPU</option>
                <option value="score">Oportunidad de precio</option>
                <option value="price">Precio menor</option>
                <option value="newest">Lectura más reciente</option>
                <option value="gpu">Clase de GPU</option>
              </select>
            </label>
          </div>
        </div>

        <div className="table-head" aria-hidden="true">
          <span>Equipo / fuente</span><span>Configuración</span><span>Precio efectivo</span><span>Precio histórico</span><span>Bang for Buck</span><span>Acciones</span>
        </div>
        <div className="listing-table">
          {listings.map((listing) => <ListingRow key={listing.id} listing={listing} />)}
        </div>
        {!listings.length && <div className="empty-state"><strong>Sin coincidencias</strong><span>Ajusta el precio o elimina algún filtro.</span></div>}
      </section>

      <footer className="app-footer">
        <span>Los precios pueden cambiar; confirma el total en la tienda.</span>
        <span>Bang for Buck usa rendimiento GPU de referencia, no el desempeño completo del equipo.</span>
      </footer>
    </main>
  );
}

function Summary({ label, value, detail, warning = false }: { label: string; value: number; detail: string; warning?: boolean }) {
  return <div className={warning ? "summary-item warning" : "summary-item"}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function FilterSelect({ label, value, onChange, options, empty, suffix = "" }: { label: string; value: string; onChange: (value: string) => void; options: string[]; empty: string; suffix?: string }) {
  return <label className="select-control"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">{empty}</option>{options.map((option) => <option key={option} value={option}>{option}{suffix}</option>)}</select></label>;
}

function ListingRow({ listing }: { listing: Listing }) {
  const discount = listing.assessment.observedDiscount30Pct;
  const coverage = Math.max(1, Math.ceil(listing.priceStats.historySpanDays));
  const benchmark = listing.hardwareValue.gpuPointsPer1000Mxn;
  return (
    <article className={listing.freshness.isStale ? "listing-row is-stale" : "listing-row"}>
      <div className="identity-cell">
        <div className="source-line"><b>{listing.store}</b><span>{sourceLabel(listing)}</span></div>
        <h2>{listing.title}</h2>
        <small>{listing.modelNumber ?? "SKU no publicado"}</small>
      </div>
      <div className="config-cell">
        <b>{listing.gpu ?? "GPU desconocida"}</b>
        <span>{listing.cpu ?? "CPU no publicada"}</span>
        <small>{listing.ramGb ? `${listing.ramGb} GB RAM` : "RAM desconocida"} · {listing.storageGb ? `${listing.storageGb} GB SSD` : "SSD desconocido"}</small>
      </div>
      <div className="price-cell">
        <strong>{currency.format(listing.effectivePriceMxn)}</strong>
        <span>{listing.shippingMxn ? `${currency.format(listing.shippingMxn)} de envío` : "envío incluido / no reportado"}</span>
      </div>
      <div className="score-cell">
        <div className="score-line"><strong>{listing.assessment.score ?? "—"}</strong><span>/100</span><Badge tone={recommendationTone(listing.assessment.recommendation)}>{listing.assessment.recommendation}</Badge></div>
        <small>Oportunidad de precio · confianza {confidenceLabel(listing.assessment.confidence)}</small>
        <span>{listing.historyState === "building" ? `historial en formación (${coverage} d)` : discount === null ? `${coverage} días observados` : `${discount >= 0 ? "↓" : "↑"} ${Math.abs(discount).toFixed(1)}% vs promedio disponible (${coverage} d)`}</span>
      </div>
      <div className="value-cell">
        {benchmark === null ? <><strong>—</strong><span>sin referencia GPU</span></> : <><strong>{benchmark.toFixed(1)}</strong><span>pts GPU / $1,000</span><small>{listing.hardwareValue.gpuBenchmarkName}</small></>}
      </div>
      <div className="action-cell">
        <Link className="primary-action" href={`/laptops/${listing.id}`}>Analizar</Link>
        <a className="secondary-action" href={listing.productUrl} target="_blank" rel="noopener noreferrer">Tienda <ArrowUpRight size={13} /></a>
      </div>
    </article>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <em className={`badge ${tone}`}>{children}</em>;
}

function sourceLabel(listing: Listing): string {
  if (listing.freshness.isStale) return `vencido · hace ${formatAge(listing.freshness.ageHours)}`;
  if (listing.dataProvenance === "google_reported") return "reportado por Google";
  return `directo · hace ${formatAge(listing.freshness.ageHours)}`;
}

function formatAge(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} d`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

function confidenceLabel(value: Listing["assessment"]["confidence"]): string {
  return { insufficient: "insuficiente", low: "baja", medium: "media", high: "alta" }[value];
}

function recommendationTone(value: Listing["assessment"]["recommendation"]): string {
  return { "BUY NOW": "positive", CONSIDER: "neutral", WAIT: "negative" }[value];
}
