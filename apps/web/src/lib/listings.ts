import { createClient } from "@supabase/supabase-js";
import { sampleListings } from "./sample-data";
import type { Listing } from "./types";

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
  observation_count: number;
};

function fromRow(row: ListingRow): Listing {
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
    effectivePriceMxn: Number(row.effective_price_mxn),
    productUrl: row.product_url,
    observedAt: row.observed_at,
    stockStatus: row.stock_status,
    historyState: row.observation_count >= 7 ? "ready" : "building",
  };
}

export async function getListings(): Promise<{ listings: Listing[]; demo: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { listings: sampleListings, demo: true };

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("listing_current")
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

