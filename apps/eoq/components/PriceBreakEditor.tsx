'use client';

import { currencySymbol } from '@sct/shared/lib/format';
import type { PriceBreakRow } from '@/lib/state';
import type { ScheduleIssue } from '@/lib/validate';

import { useSettings } from './Settings';

export interface PriceBreakEditorProps {
  rows: PriceBreakRow[];
  onChange: (rows: PriceBreakRow[]) => void;
  issues: ScheduleIssue[];
  disabled?: boolean;
}

/**
 * The all-units price break schedule.
 *
 * Two columns rather than one field per line: the schedule is a small table,
 * and reading down a column of break quantities is how a buyer checks it
 * against a supplier's quote. Problems are reported against the row that
 * caused them rather than as one message for the whole schedule.
 */
export function PriceBreakEditor({ rows, onChange, issues, disabled = false }: PriceBreakEditorProps) {
  const { locale, currency, t } = useSettings();
  const symbol = currencySymbol(currency, locale);

  const scheduleIssue = issues.find((issue) => issue.row === null);

  function update(index: number, patch: Partial<PriceBreakRow>) {
    onChange(rows.map((row, position) => (position === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    onChange([...rows, { minQty: '', unitCost: '' }]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, position) => position !== index));
  }

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[1fr_1fr_1.75rem] gap-x-2">
        <span className="t-micro text-[color:var(--text-2)]">{t.discounts.minQty}</span>
        <span className="t-micro text-[color:var(--text-2)]">
          {t.discounts.columns.unitCost} <span className="unit">{symbol}</span>
        </span>
        <span />
      </div>

      {rows.map((row, index) => {
        const rowIssues = issues.filter((issue) => issue.row === index);
        const quantityId = `break-qty-${index}`;
        const costId = `break-cost-${index}`;
        const tierName = `${t.discounts.columns.tier} ${index + 1}`;

        return (
          <div key={index} className="space-y-1">
            <div className="grid grid-cols-[1fr_1fr_1.75rem] items-center gap-x-2">
              <label htmlFor={quantityId} className="sr-only">
                {`${t.discounts.minQty}, ${tierName}`}
              </label>
              <input
                id={quantityId}
                className="field-input t-body"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={row.minQty}
                disabled={disabled}
                aria-invalid={rowIssues.length > 0 ? 'true' : undefined}
                onChange={(event) => update(index, { minQty: event.target.value })}
              />

              <label htmlFor={costId} className="sr-only">
                {`${t.discounts.columns.unitCost}, ${tierName}`}
              </label>
              <input
                id={costId}
                className="field-input t-body"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={row.unitCost}
                disabled={disabled}
                aria-invalid={rowIssues.length > 0 ? 'true' : undefined}
                onChange={(event) => update(index, { unitCost: event.target.value })}
              />

              <button
                type="button"
                className="btn btn-quiet t-micro justify-self-center px-1.5 py-1"
                disabled={disabled || rows.length <= 1}
                aria-label={`${t.actions.removeTier}, ${tierName}`}
                onClick={() => removeRow(index)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            {rowIssues.map((issue) => (
              <p key={issue.code} className="t-micro text-[color:var(--signal)]">
                {t.schedule[issue.code]}
              </p>
            ))}
          </div>
        );
      })}

      {scheduleIssue === undefined ? null : (
        <p className="t-micro text-[color:var(--signal)]">{t.schedule[scheduleIssue.code]}</p>
      )}

      <button type="button" className="btn t-micro" disabled={disabled} onClick={addRow}>
        {t.actions.addTier}
      </button>
    </div>
  );
}
