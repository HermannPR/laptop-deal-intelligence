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
};

export type ListingFilters = {
  query: string;
  maxPrice: number;
  store: string;
  gpu: string;
  minRam: number;
  sort: "price" | "newest" | "gpu";
};

