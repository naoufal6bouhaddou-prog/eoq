/**
 * Normal-distribution helpers.
 *
 * Pure numeric code: no React, no Intl, no strings. Everything here is
 * deterministic and unit-tested against published values.
 */

/*
 * Peter Acklam's rational approximation to the inverse standard normal CDF.
 * Relative error is below 1.15e-9 across the whole open interval (0, 1),
 * which is several orders of magnitude finer than anything this tool
 * displays. Written out rather than pulled from a statistics package,
 * because a statistics package for one function is not worth the weight.
 */

const A0 = -3.969683028665376e1;
const A1 = 2.209460984245205e2;
const A2 = -2.759285104469687e2;
const A3 = 1.38357751867269e2;
const A4 = -3.066479806614716e1;
const A5 = 2.506628277459239;

const B0 = -5.447609879822406e1;
const B1 = 1.615858368580409e2;
const B2 = -1.556989798598866e2;
const B3 = 6.680131188771972e1;
const B4 = -1.328068155288572e1;

const C0 = -7.784894002430293e-3;
const C1 = -3.223964580411365e-1;
const C2 = -2.400758277161838;
const C3 = -2.549732539343734;
const C4 = 4.374664141464968;
const C5 = 2.938163982698783;

const D0 = 7.784695709041462e-3;
const D1 = 3.224671290700398e-1;
const D2 = 2.445134137142996;
const D3 = 3.754408661907416;

/** Boundaries between the tail branches and the central branch. */
const P_LOW = 0.02425;
const P_HIGH = 1 - P_LOW;

/**
 * z such that P(Z <= z) = p for a standard normal Z.
 *
 * Returns NaN when p is outside the open interval (0, 1). The domain is open
 * on purpose: a 100% cycle service level requires infinite safety stock and is
 * not attainable, so it is rejected here rather than silently clamped.
 */
export function inverseNormalCdf(p: number): number {
  if (!Number.isFinite(p) || p <= 0 || p >= 1) return NaN;

  if (p < P_LOW) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((C0 * q + C1) * q + C2) * q + C3) * q + C4) * q + C5) /
      ((((D0 * q + D1) * q + D2) * q + D3) * q + 1)
    );
  }

  if (p > P_HIGH) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((C0 * q + C1) * q + C2) * q + C3) * q + C4) * q + C5) /
      ((((D0 * q + D1) * q + D2) * q + D3) * q + 1)
    );
  }

  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((A0 * r + A1) * r + A2) * r + A3) * r + A4) * r + A5) * q) /
    (((((B0 * r + B1) * r + B2) * r + B3) * r + B4) * r + 1)
  );
}

/**
 * Safety factor for a cycle service level expressed as a fraction (0.95 = 95%).
 * Named separately from inverseNormalCdf so call sites read in the vocabulary
 * of inventory control rather than the vocabulary of statistics.
 */
export function safetyFactor(cycleServiceLevel: number): number {
  return inverseNormalCdf(cycleServiceLevel);
}
