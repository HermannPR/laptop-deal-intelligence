export type PriceStats = {
  average7dMxn: number | null;
  average30dMxn: number | null;
  average90dMxn: number | null;
  historicalMinMxn: number;
  historicalMaxMxn: number;
  observationCount: number;
  observedDays: number;
  priceChangeCount: number;
  historySpanDays: number;
};

export type PriceConfidence = "insufficient" | "low" | "medium" | "high";
export type PriceRecommendation = "BUY NOW" | "CONSIDER" | "WAIT";

export type PriceAssessment = {
  score: number | null;
  confidence: PriceConfidence;
  recommendation: PriceRecommendation;
  observedDiscount30Pct: number | null;
  distanceFromMinimumPct: number;
  reasons: string[];
};

const clamp = (value: number, minimum = 0, maximum = 100) =>
  Math.min(maximum, Math.max(minimum, value));

export function assessPrice(currentPriceMxn: number, stats: PriceStats): PriceAssessment {
  const discount30 = stats.average30dMxn
    ? ((stats.average30dMxn - currentPriceMxn) / stats.average30dMxn) * 100
    : null;
  const distanceFromMinimum = stats.historicalMinMxn
    ? ((currentPriceMxn - stats.historicalMinMxn) / stats.historicalMinMxn) * 100
    : 0;
  const confidence = priceConfidence(stats);

  if (confidence === "insufficient") {
    return {
      score: null,
      confidence,
      recommendation: "CONSIDER",
      observedDiscount30Pct: discount30,
      distanceFromMinimumPct: distanceFromMinimum,
      reasons: ["Aún no hay suficiente historial para calificar el precio con confianza."],
    };
  }

  const range = stats.historicalMaxMxn - stats.historicalMinMxn;
  const historyPosition =
    range / Math.max(stats.historicalMinMxn, 1) < 0.01
      ? 50
      : clamp(((stats.historicalMaxMxn - currentPriceMxn) / range) * 100);
  const recentDiscountSignal = discount30 === null ? 50 : clamp(50 + discount30 * 4);
  const minimumProximity = clamp(100 - Math.max(0, distanceFromMinimum) * 5);
  const score = Math.round(
    historyPosition * 0.45 + recentDiscountSignal * 0.35 + minimumProximity * 0.2,
  );

  let recommendation: PriceRecommendation = "CONSIDER";
  if (score >= 82 && (discount30 ?? 0) >= 5) recommendation = "BUY NOW";
  else if (score <= 35 || (discount30 ?? 0) < -8) recommendation = "WAIT";

  return {
    score,
    confidence,
    recommendation,
    observedDiscount30Pct: discount30,
    distanceFromMinimumPct: distanceFromMinimum,
    reasons: priceReasons(discount30, distanceFromMinimum, stats),
  };
}

function priceConfidence(stats: PriceStats): PriceConfidence {
  if (stats.observationCount < 4 || stats.observedDays < 3 || stats.historySpanDays < 2) {
    return "insufficient";
  }
  if (stats.observationCount < 8 || stats.historySpanDays < 7) return "low";
  if (stats.observationCount < 20 || stats.historySpanDays < 21) return "medium";
  return "high";
}

function priceReasons(
  discount30: number | null,
  distanceFromMinimum: number,
  stats: PriceStats,
): string[] {
  const reasons: string[] = [];
  if (distanceFromMinimum <= 3) {
    reasons.push("Está a menos de 3% del mínimo observado.");
  } else if (distanceFromMinimum >= 10) {
    reasons.push(`Está ${distanceFromMinimum.toFixed(1)}% por encima del mínimo observado.`);
  }
  if (discount30 !== null && discount30 >= 5) {
    reasons.push(`Está ${discount30.toFixed(1)}% debajo del promedio de 30 días.`);
  } else if (discount30 !== null && discount30 <= -5) {
    reasons.push(`Está ${Math.abs(discount30).toFixed(1)}% encima del promedio de 30 días.`);
  }
  if (stats.priceChangeCount === 0) {
    reasons.push("El precio no ha cambiado durante el historial disponible.");
  }
  return reasons.length ? reasons : ["El precio está cerca de su rango histórico habitual."];
}
