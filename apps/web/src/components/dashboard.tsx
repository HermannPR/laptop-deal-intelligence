"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Database, Gauge, Search, SlidersHorizontal } from "lucide-react";
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
  sort: "price",
};

export function Dashboard({ initialListings, demo }: { initialListings: Listing[]; demo: boolean }) {
  const [filters, setFilters] = useState(initialFilters);
  const listings = useMemo(() => filterListings(initialListings, filters), [initialListings, filters]);
  const stores = [...new Set(initialListings.map((item) => item.store))];
  const newest = initialListings.reduce((latest, item) =>
    Date.parse(item.observedAt) > Date.parse(latest) ? item.observedAt : latest,
  initialListings[0]?.observedAt ?? new Date().toISOString());

  const update = <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  return (
    <main>
      <header className="masthead">
        <a className="brand" href="#top" aria-label="Precio Justo, inicio">
          <span className="brand-mark">PJ</span>
          <span>PRECIO JUSTO</span>
        </a>
        <div className="market-status"><span /> MERCADO MX · MONITOREO ACTIVO</div>
        <div className="edition">EDICIÓN PERSONAL<br />07 AGO 2026</div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">INTELIGENCIA DE COMPRA / LAPTOS MÉXICO</p>
          <h1>El descuento grita.<br /><em>La evidencia decide.</em></h1>
          <p className="dek">Precios observados, hardware comparable y enlaces directos. Sin repetir la publicidad de la tienda.</p>
        </div>
        <div className="pulse-card">
          <div className="pulse-label"><Gauge size={17} /> PULSO DEL MERCADO</div>
          <strong>{initialListings.length}</strong>
          <span>configuraciones vigiladas</span>
          <div className="spark" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <small>ÚLTIMA LECTURA · {new Date(newest).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</small>
        </div>
      </section>

      {demo && (
        <div className="demo-banner"><Database size={16} /> VISTA DE DEMOSTRACIÓN · conecta Supabase para sustituir estos datos por observaciones en vivo.</div>
      )}

      <section className="workspace">
        <aside className="filters">
          <div className="section-title"><SlidersHorizontal size={17} /><span>FILTROS</span><b>{listings.length}</b></div>
          <label className="search-box">
            <Search size={18} />
            <input value={filters.query} onChange={(event) => update("query", event.target.value)} placeholder="Modelo, CPU o GPU" />
          </label>

          <div className="filter-group range-group">
            <label>TOPE DE PRESUPUESTO <b>{currency.format(filters.maxPrice)}</b></label>
            <input type="range" min="12000" max="60000" step="1000" value={filters.maxPrice} onChange={(event) => update("maxPrice", Number(event.target.value))} />
            <div><span>$12k</span><span>$60k+</span></div>
          </div>

          <FilterSelect label="TIENDA" value={filters.store} onChange={(value) => update("store", value)} options={stores} empty="Todas" />
          <FilterSelect label="GPU" value={filters.gpu} onChange={(value) => update("gpu", value)} options={["RTX 4050", "RTX 5050", "RTX 5060", "RTX 5070"]} empty="Cualquier GPU" />
          <FilterSelect label="RAM MÍNIMA" value={String(filters.minRam)} onChange={(value) => update("minRam", Number(value))} options={["16", "24", "32"]} empty="Sin mínimo" suffix=" GB" />

          <button className="reset" onClick={() => setFilters(initialFilters)}>LIMPIAR FILTROS</button>
          <div className="method-note"><b>NOTA DE MÉTODO</b><p>El precio efectivo incluye envío cuando la tienda lo publica. El historial requiere observaciones repetidas.</p></div>
        </aside>

        <section className="results">
          <div className="results-head">
            <div><span>RADAR ACTUAL</span><h2>{listings.length} oportunidades bajo análisis</h2></div>
            <label>ORDENAR POR
              <select value={filters.sort} onChange={(event) => update("sort", event.target.value as ListingFilters["sort"])}>
                <option value="price">Menor precio efectivo</option>
                <option value="newest">Observación reciente</option>
                <option value="gpu">Clase de GPU</option>
              </select>
            </label>
          </div>

          <div className="listing-grid">
            {listings.map((listing, index) => <ListingCard key={listing.id} listing={listing} index={index} />)}
          </div>
          {!listings.length && <div className="empty"><strong>Sin coincidencias.</strong><span>Amplía el presupuesto o limpia alguno de los filtros.</span></div>}
        </section>
      </section>

      <footer><span>PRECIO JUSTO / MÉXICO</span><p>Los precios pueden cambiar. Verifica disponibilidad y total antes de comprar.</p><span>DATOS CON PROCEDENCIA</span></footer>
    </main>
  );
}

function FilterSelect({ label, value, onChange, options, empty, suffix = "" }: { label: string; value: string; onChange: (value: string) => void; options: string[]; empty: string; suffix?: string }) {
  return (
    <label className="filter-group">{label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{empty}</option>
        {options.map((option) => <option key={option} value={option}>{option}{suffix}</option>)}
      </select>
    </label>
  );
}

function ListingCard({ listing, index }: { listing: Listing; index: number }) {
  const shipping = listing.shippingMxn ? `+ ${currency.format(listing.shippingMxn)} envío` : "envío incluido";
  return (
    <article className="listing-card" style={{ "--delay": `${index * 55}ms` } as React.CSSProperties}>
      <div className="card-index">{String(index + 1).padStart(2, "0")}</div>
      <div className="card-main">
        <div className="card-meta"><span>{listing.store}</span><span>{listing.stockStatus === "low_stock" ? "POCAS PIEZAS" : "EN EXISTENCIA"}</span></div>
        <h3>{listing.title}</h3>
        <div className="spec-row">
          <span><small>CPU</small>{listing.cpu ?? "No publicado"}</span>
          <span><small>GPU</small>{listing.gpu ?? "No publicada"}</span>
          <span><small>MEMORIA</small>{listing.ramGb ? `${listing.ramGb} GB RAM` : "Desconocida"}</span>
          <span><small>PANTALLA</small>{listing.screen ?? "No publicada"}</span>
        </div>
      </div>
      <div className="price-block">
        <small>PRECIO EFECTIVO</small>
        <strong>{currency.format(listing.effectivePriceMxn)}</strong>
        <span>{shipping}</span>
        <div className="history-chip">{listing.historyState === "building" ? "HISTORIAL EN FORMACIÓN" : "HISTORIAL DISPONIBLE"}</div>
        <a href={listing.productUrl} target="_blank" rel="noopener noreferrer">VER OFERTA <ArrowUpRight size={16} /></a>
      </div>
    </article>
  );
}

