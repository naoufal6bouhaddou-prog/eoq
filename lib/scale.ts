/**
 * Axis arithmetic for the hand-built chart. Pure, so the awkward parts —
 * choosing readable tick values, mapping a domain onto pixels — can be tested
 * without a browser.
 */

/** Round a rough step up to the nearest 1, 2, 5 or 10 times a power of ten. */
export function niceStep(rough: number): number {
  if (!(rough > 0) || !Number.isFinite(rough)) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalised = rough / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

/**
 * Tick values across a range, landing on round numbers a reader can hold in
 * their head rather than on evenly divided fractions of the data.
 */
export function niceTicks(min: number, max: number, target = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || !(max > min)) return [];

  const step = niceStep((max - min) / Math.max(1, target));
  const first = Math.ceil(min / step) * step;
  const ticks: number[] = [];

  // The epsilon keeps a tick that lands exactly on the maximum from being lost
  // to floating point, without inventing one past the end of the range.
  for (let value = first; value <= max + step * 1e-9; value += step) {
    ticks.push(Number(value.toPrecision(12)));
  }
  return ticks;
}

export type Scale = (value: number) => number;

/** Map a domain onto a pixel range. */
export function linearScale(domain: [number, number], range: [number, number]): Scale {
  const [domainStart, domainEnd] = domain;
  const [rangeStart, rangeEnd] = range;
  const span = domainEnd - domainStart;

  if (span === 0) return () => rangeStart;
  return (value) => rangeStart + ((value - domainStart) / span) * (rangeEnd - rangeStart);
}

/** Invert a linear scale: pixels back to a domain value. */
export function invertLinear(domain: [number, number], range: [number, number]): Scale {
  const [domainStart, domainEnd] = domain;
  const [rangeStart, rangeEnd] = range;
  const span = rangeEnd - rangeStart;

  if (span === 0) return () => domainStart;
  return (pixel) => domainStart + ((pixel - rangeStart) / span) * (domainEnd - domainStart);
}

export function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}
