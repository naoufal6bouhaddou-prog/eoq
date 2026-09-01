import { describe, expect, it } from 'vitest';

import { clamp, invertLinear, linearScale, niceStep, niceTicks } from './scale';

describe('nice steps', () => {
  it('rounds up to 1, 2, 5 or 10 times a power of ten', () => {
    expect(niceStep(1)).toBe(1);
    expect(niceStep(1.5)).toBe(2);
    expect(niceStep(3)).toBe(5);
    expect(niceStep(7)).toBe(10);
    expect(niceStep(230)).toBe(500);
    expect(niceStep(0.03)).toBeCloseTo(0.05, 10);
  });

  it('falls back to 1 rather than returning nonsense', () => {
    expect(niceStep(0)).toBe(1);
    expect(niceStep(-4)).toBe(1);
    expect(niceStep(NaN)).toBe(1);
  });
});

describe('nice ticks', () => {
  it('lands on round numbers inside the range', () => {
    expect(niceTicks(0, 1000, 5)).toEqual([0, 200, 400, 600, 800, 1000]);
    expect(niceTicks(0, 1414.21, 4)).toEqual([0, 500, 1000]);
  });

  it('starts at the first round value at or above the minimum', () => {
    expect(niceTicks(176, 1768, 4)).toEqual([500, 1000, 1500]);
  });

  it('keeps a tick that lands exactly on the maximum', () => {
    expect(niceTicks(0, 500, 5)).toContain(500);
  });

  it('never invents ticks past the end of the range', () => {
    for (const [min, max] of [
      [0, 707.1],
      [176, 1768],
      [0.02, 0.9],
      [1000, 1001],
    ]) {
      for (const tick of niceTicks(min, max)) {
        expect(tick).toBeGreaterThanOrEqual(min);
        expect(tick).toBeLessThanOrEqual(max);
      }
    }
  });

  it('returns nothing for a degenerate range instead of looping', () => {
    expect(niceTicks(5, 5)).toEqual([]);
    expect(niceTicks(10, 1)).toEqual([]);
    expect(niceTicks(NaN, 10)).toEqual([]);
    expect(niceTicks(0, Infinity)).toEqual([]);
  });
});

describe('linear scale', () => {
  const scale = linearScale([0, 100], [40, 240]);

  it('maps the ends of the domain onto the ends of the range', () => {
    expect(scale(0)).toBe(40);
    expect(scale(100)).toBe(240);
    expect(scale(50)).toBe(140);
  });

  it('inverts', () => {
    const invert = invertLinear([0, 100], [40, 240]);
    for (const value of [0, 12.5, 50, 99, 100]) {
      expect(invert(scale(value))).toBeCloseTo(value, 9);
    }
  });

  it('handles an inverted pixel range, which is what a y-axis is', () => {
    const y = linearScale([0, 1000], [300, 20]);
    expect(y(0)).toBe(300);
    expect(y(1000)).toBe(20);
    expect(y(500)).toBe(160);
  });

  it('does not divide by zero on a flat domain', () => {
    expect(linearScale([7, 7], [0, 100])(7)).toBe(0);
    expect(invertLinear([0, 10], [5, 5])(5)).toBe(0);
  });
});

describe('clamp', () => {
  it('holds a value inside its bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });
});
