import type { Listing, ListingFilters } from "./types";

export function filterListings(listings: Listing[], filters: ListingFilters): Listing[] {
  const query = filters.query.trim().toLocaleLowerCase("es-MX");
  const filtered = listings.filter((listing) => {
    const haystack = [listing.title, listing.brand, listing.cpu, listing.gpu, listing.modelNumber]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("es-MX");

    return (
      (!query || haystack.includes(query)) &&
      listing.effectivePriceMxn <= filters.maxPrice &&
      (!filters.store || listing.store === filters.store) &&
      (!filters.gpu || listing.gpu?.includes(filters.gpu)) &&
      (listing.ramGb ?? 0) >= filters.minRam
    );
  });

  return filtered.sort((a, b) => {
    if (filters.sort === "score") {
      return (b.assessment.score ?? -1) - (a.assessment.score ?? -1);
    }
    if (filters.sort === "newest") {
      return Date.parse(b.observedAt) - Date.parse(a.observedAt);
    }
    if (filters.sort === "gpu") {
      return (b.gpu ?? "").localeCompare(a.gpu ?? "");
    }
    return a.effectivePriceMxn - b.effectivePriceMxn;
  });
}
