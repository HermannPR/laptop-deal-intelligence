import type { PriceAssessment, PriceStats } from "./price-intelligence";

export type Listing = {
  id: string;
  store: string;
  title: string;
  brand: string;
  modelNumber: string | null;
  cpu: string | null;
  gpu: string | null;
  ramGb: number | null;
  storageGb: number | null;
  screen: string | null;
  priceMxn: number;
  shippingMxn: number;
  effectivePriceMxn: number;
  productUrl: string;
  observedAt: string;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock" | "unknown";
  historyState: "building" | "ready";
  dataProvenance: "direct" | "google_reported";
  freshness: {
    isStale: boolean;
    ageHours: number;
    staleAfterHours: number;
  };
  hardwareValue: {
    gpuBenchmarkScore: number | null;
    gpuBenchmarkName: string | null;
    gpuBenchmarkSource: string | null;
    gpuBenchmarkSourceUrl: string | null;
    gpuPointsPer1000Mxn: number | null;
  };
  priceStats: PriceStats;
  assessment: PriceAssessment;
};

export type PricePoint = {
  priceMxn: number;
  observedAt: string;
};

export type ListingDetail = {
  listing: Listing;
  priceHistory: PricePoint[];
  alternatives: Listing[];
  demo: boolean;
};

export type ListingFilters = {
  query: string;
  maxPrice: number;
  store: string;
  gpu: string;
  cpu: string;
  minRam: number;
  rtxOnly: boolean;
  includeStale: boolean;
  sort: "bang" | "score" | "price" | "newest" | "gpu";
};
