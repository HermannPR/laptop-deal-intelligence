import { createClient } from "@supabase/supabase-js";
import { sampleListings } from "./sample-data";
import { assessPrice, type PriceStats } from "./price-intelligence";
import type { Listing, ListingDetail, PricePoint } from "./types";

type ListingRow = {
  id: string;
  store_name: string;
  title: string;
  brand: string;
  model_number: string | null;
  cpu_model: string | null;
  gpu_model: string | null;
  ram_gb: number | null;
  storage_gb: number | null;
  screen_summary: string | null;
  current_price_mxn: number;
  shipping_mxn: number;
  effective_price_mxn: number;
  product_url: string;
  observed_at: string;
  stock_status: Listing["stockStatus"];
  data_provenance: Listing["dataProvenance"];
  average_7d_mxn: number | null;
  average_30d_mxn: number | null;
  average_90d_mxn: number | null;
  historical_min_mxn: number;
  historical_max_mxn: number;
  observation_count: number;
  observed_days: number;
  price_change_count: number;
  history_span_days: number;
};

function fromRow(row: ListingRow): Listing {
  const priceStats: PriceStats = {
    average7dMxn: nullableNumber(row.average_7d_mxn),
    average30dMxn: nullableNumber(row.average_30d_mxn),
    average90dMxn: nullableNumber(row.average_90d_mxn),
    historicalMinMxn: Number(row.historical_min_mxn),
    historicalMaxMxn: Number(row.historical_max_mxn),
    observationCount: Number(row.observation_count),
    observedDays: Number(row.observed_days),
    priceChangeCount: Number(row.price_change_count),
    historySpanDays: Number(row.history_span_days),
  };
  const effectivePriceMxn = Number(row.effective_price_mxn);
  return {
    id: row.id,
    store: row.store_name,
    title: row.title,
    brand: row.brand,
    modelNumber: row.model_number,
    cpu: row.cpu_model,
    gpu: row.gpu_model,
    ramGb: row.ram_gb,
    storageGb: row.storage_gb,
    screen: row.screen_summary,
    priceMxn: Number(row.current_price_mxn),
    shippingMxn: Number(row.shipping_mxn),
    effectivePriceMxn,
    productUrl: row.product_url,
    observedAt: row.observed_at,
    stockStatus: row.stock_status,
    historyState:
      priceStats.observationCount >= 4 && priceStats.historySpanDays >= 2 ? "ready" : "building",
    dataProvenance: row.data_provenance,
    priceStats,
    assessment: assessPrice(effectivePriceMxn, priceStats),
  };
}

export async function getListings(): Promise<{ listings: Listing[]; demo: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { listings: sampleListings, demo: true };

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("listing_price_intelligence")
    .select("*")
    .neq("stock_status", "out_of_stock")
    .order("effective_price_mxn", { ascending: true })
    .limit(250);

  if (error || !data?.length) {
    console.warn("Supabase listings unavailable; rendering demo data", error?.message);
    return { listings: sampleListings, demo: true };
  }

  return { listings: (data as ListingRow[]).map(fromRow), demo: false };
}

export async function getListingDetail(id: string): Promise<ListingDetail | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    const listing = sampleListings.find((item) => item.id === id);
    return listing ? { listing, priceHistory: demoHistory(listing), demo: true } : null;
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const [listingResult, historyResult] = await Promise.all([
    supabase.from("listing_price_intelligence").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("price_observations")
      .select("effective_price_mxn, observed_at")
      .eq("listing_id", id)
      .order("observed_at", { ascending: true })
      .limit(365),
  ]);

  if (listingResult.error || !listingResult.data) return null;
  const priceHistory: PricePoint[] = (historyResult.data ?? []).map((point) => ({
    priceMxn: Number(point.effective_price_mxn),
    observedAt: point.observed_at,
  }));
  return {
    listing: fromRow(listingResult.data as ListingRow),
    priceHistory,
    demo: false,
  };
}

function nullableNumber(value: number | null): number | null {
  return value === null ? null : Number(value);
}

function demoHistory(listing: Listing): PricePoint[] {
  const multipliers = [1.12, 1.1, 1.08, 1.08, 1.05, 1.07, 1.03, 1.01, 1.02, 1];
  return multipliers.map((multiplier, index) => ({
    priceMxn: Math.round(listing.effectivePriceMxn * multiplier),
    observedAt: new Date(Date.UTC(2026, 6, 9 + index * 3, 14)).toISOString(),
  }));
}
