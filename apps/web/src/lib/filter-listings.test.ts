import { describe, expect, it } from "vitest";
import { filterListings } from "./filter-listings";
import { sampleListings } from "./sample-data";

describe("filterListings", () => {
  it("filters by effective price and hardware query", () => {
    const results = filterListings(sampleListings, {
      query: "RTX 4050",
      maxPrice: 25000,
      store: "",
      gpu: "",
      cpu: "",
      minRam: 16,
      rtxOnly: false,
      includeStale: false,
      sort: "price",
    });
    expect(results).toHaveLength(1);
    expect(results[0].brand).toBe("HP");
  });

  it("includes shipping when sorting by price", () => {
    const results = filterListings(sampleListings, {
      query: "",
      maxPrice: 60000,
      store: "",
      gpu: "",
      cpu: "",
      minRam: 0,
      rtxOnly: false,
      includeStale: false,
      sort: "price",
    });
    expect(results[0].effectivePriceMxn).toBeLessThanOrEqual(results[1].effectivePriceMxn);
  });

  it("puts the strongest observed price opportunity first", () => {
    const results = filterListings(sampleListings, {
      query: "",
      maxPrice: 60000,
      store: "",
      gpu: "",
      cpu: "",
      minRam: 0,
      rtxOnly: false,
      includeStale: false,
      sort: "score",
    });
    expect(results[0].assessment.score).toBeGreaterThanOrEqual(results[1].assessment.score ?? 0);
  });

  it("sorts sourced GPU performance per peso", () => {
    const results = filterListings(sampleListings, {
      query: "",
      maxPrice: 60000,
      store: "",
      gpu: "",
      cpu: "",
      minRam: 0,
      rtxOnly: false,
      includeStale: false,
      sort: "bang",
    });
    expect(results[0].hardwareValue.gpuPointsPer1000Mxn).toBeGreaterThanOrEqual(
      results[1].hardwareValue.gpuPointsPer1000Mxn ?? 0,
    );
  });

  it("filters by the selected processor", () => {
    const processor = sampleListings.find((listing) => listing.cpu)?.cpu;
    expect(processor).toBeTruthy();

    const results = filterListings(sampleListings, {
      query: "",
      maxPrice: 60000,
      store: "",
      gpu: "",
      cpu: processor ?? "",
      minRam: 0,
      rtxOnly: false,
      includeStale: true,
      sort: "price",
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((listing) => listing.cpu === processor)).toBe(true);
  });

  it("can focus the feed on NVIDIA RTX listings", () => {
    const withoutGpu = { ...sampleListings[0], id: "without-gpu", gpu: null };
    const results = filterListings([...sampleListings, withoutGpu], {
      query: "",
      maxPrice: 60000,
      store: "",
      gpu: "",
      cpu: "",
      minRam: 0,
      rtxOnly: true,
      includeStale: true,
      sort: "price",
    });

    expect(results).not.toContainEqual(withoutGpu);
    expect(results.every((listing) => listing.gpu?.includes("RTX"))).toBe(true);
  });
});
