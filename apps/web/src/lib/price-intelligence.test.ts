import { describe, expect, it } from "vitest";
import { assessPrice, type PriceStats } from "./price-intelligence";

const strongHistory: PriceStats = {
  average7dMxn: 26000,
  average30dMxn: 26800,
  average90dMxn: 27500,
  historicalMinMxn: 22900,
  historicalMaxMxn: 29900,
  observationCount: 32,
  observedDays: 24,
  priceChangeCount: 5,
  historySpanDays: 40,
};

describe("assessPrice", () => {
  it("recognizes a current price close to the historical minimum", () => {
    const result = assessPrice(23999, strongHistory);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.recommendation).toBe("BUY NOW");
    expect(result.observedDiscount30Pct).toBeCloseTo(10.45, 1);
  });

  it("recommends waiting when the price is well above its recent average", () => {
    const result = assessPrice(29500, strongHistory);
    expect(result.score).toBeLessThanOrEqual(35);
    expect(result.recommendation).toBe("WAIT");
  });

  it("refuses to invent a score from insufficient history", () => {
    const result = assessPrice(23999, {
      ...strongHistory,
      observationCount: 2,
      observedDays: 1,
      historySpanDays: 0,
    });
    expect(result.score).toBeNull();
    expect(result.confidence).toBe("insufficient");
  });
});
