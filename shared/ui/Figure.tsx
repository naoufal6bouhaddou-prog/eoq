'use client';

import {
  EMPTY_VALUE,
  formatNumber,
  splitFormatted,
  type FormatOptions,
} from '@/shared/lib/format';

import { useSettings } from './settings';

export interface FigureProps extends FormatOptions {
  value: number | null | undefined;
  /**
   * Characters of width to reserve. Live figures change as the user types;
   * reserving the column stops the layout jumping on every keystroke.
   */
  width?: number;
  className?: string;
  /** Stable hook for the end-to-end tests, which must not rely on wording. */
  testId?: string;
}

/**
 * One number, split at its decimal mark into a right-aligned integer part and
 * a left-aligned fraction, so a column of figures lines up on the point rather
 * than ragged right. Never renders NaN, Infinity or a negative zero: those
 * arrive here as the empty marker.
 */
export function Figure({
  value,
  decimals = 2,
  signed = false,
  width,
  className,
  testId,
}: FigureProps) {
  const { locale } = useSettings();

  const usable = value === null || value === undefined ? Number.NaN : value;
  const formatted = formatNumber(usable, locale, { decimals, signed });

  if (formatted === EMPTY_VALUE) {
    return (
      <span
        className={`figure-cell ${className ?? ''}`}
        style={width === undefined ? undefined : { minWidth: `${width}ch` }}
        data-testid={testId}
      >
        <span className="int text-[color:var(--text-2)]">{EMPTY_VALUE}</span>
        <span className="frac" />
      </span>
    );
  }

  const { integer, fraction } = splitFormatted(formatted, locale);

  return (
    <span
      className={`figure-cell ${className ?? ''}`}
      style={width === undefined ? undefined : { minWidth: `${width}ch` }}
      data-testid={testId}
    >
      <span className="int">{integer}</span>
      <span className="frac">{fraction}</span>
    </span>
  );
}

/**
 * A figure with the unit that qualifies it. The unit is set smaller and
 * lighter: the number is the content, the unit is the annotation.
 */
export function Measure({
  value,
  unit,
  decimals = 2,
  signed = false,
  width,
  className,
  testId,
}: FigureProps & { unit?: string }) {
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-[0.35em] ${className ?? ''}`}>
      <Figure value={value} decimals={decimals} signed={signed} width={width} testId={testId} />
      {unit !== undefined && unit !== '' ? <span className="unit">{unit}</span> : null}
    </span>
  );
}
