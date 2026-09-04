import { describe, expect, it } from 'vitest';

import { inverseNormalCdf, safetyFactor } from './stats';

describe('inverse standard normal CDF', () => {
  /** Published safety factors, the ones a supply chain textbook tabulates. */
  const published: Array<[number, number]> = [
    [0.5, 0],
    [0.9, 1.2816],
    [0.95, 1.6449],
    [0.975, 1.96],
    [0.99, 2.3263],
  ];

  it.each(published)('z(%f) = %f', (probability, expected) => {
    expect(inverseNormalCdf(probability)).toBeCloseTo(expected, 4);
  });

  it('matches high-precision values to nine decimals', () => {
    expect(inverseNormalCdf(0.9)).toBeCloseTo(1.2815515655, 6);
    expect(inverseNormalCdf(0.95)).toBeCloseTo(1.644853627, 6);
    expect(inverseNormalCdf(0.975)).toBeCloseTo(1.9599639845, 6);
    expect(inverseNormalCdf(0.99)).toBeCloseTo(2.326347874, 6);
    expect(inverseNormalCdf(0.999)).toBeCloseTo(3.0902323062, 6);
  });

  it('is exactly zero at the median', () => {
    expect(inverseNormalCdf(0.5)).toBe(0);
  });

  it('is antisymmetric about the median', () => {
    for (const probability of [0.001, 0.01, 0.1, 0.25, 0.4, 0.499]) {
      expect(inverseNormalCdf(probability)).toBeCloseTo(-inverseNormalCdf(1 - probability), 9);
    }
  });

  it('increases across the whole interval', () => {
    let previous = -Infinity;
    for (let probability = 0.001; probability < 1; probability += 0.001) {
      const z = inverseNormalCdf(probability);
      expect(z).toBeGreaterThan(previous);
      previous = z;
    }
  });

  it('agrees with a numerically integrated normal, including across the tails', () => {
    // Simpson's rule on the density: slow, but it owes nothing to the rational
    // approximation under test, so it is a real second opinion rather than an
    // echo. Probabilities either side of the 0.02425 branch boundary included.
    const density = (x: number) => Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
    const cumulative = (x: number) => {
      const lower = -40;
      if (x <= lower) return 0;
      let steps = Math.max(2000, Math.ceil((x - lower) / 1e-4));
      if (steps % 2 === 1) steps += 1;
      const width = (x - lower) / steps;
      let sum = density(lower) + density(x);
      for (let i = 1; i < steps; i += 1) {
        sum += (i % 2 === 1 ? 4 : 2) * density(lower + i * width);
      }
      return (sum * width) / 3;
    };

    for (const probability of [
      1e-6, 0.0242, 0.02424, 0.02425, 0.02426, 0.0243, 0.1, 0.5, 0.9, 0.95, 0.975, 0.99,
      0.9757, 0.999, 1 - 1e-6,
    ]) {
      expect(cumulative(inverseNormalCdf(probability))).toBeCloseTo(probability, 9);
    }
  });

  it('stays continuous where the branches meet at p = 0.02425', () => {
    const below = inverseNormalCdf(0.024249);
    const boundary = inverseNormalCdf(0.02425);
    const above = inverseNormalCdf(0.024251);
    expect(boundary - below).toBeLessThan(1e-4);
    expect(above - boundary).toBeLessThan(1e-4);
    expect(boundary).toBeCloseTo(-1.9729610513, 8);
  });

  it('refuses probabilities outside the open interval rather than guessing', () => {
    for (const probability of [0, 1, -0.5, 1.5, NaN, Infinity]) {
      expect(inverseNormalCdf(probability)).toBeNaN();
    }
  });

  it('is what safetyFactor calls', () => {
    expect(safetyFactor(0.95)).toBe(inverseNormalCdf(0.95));
  });
});
