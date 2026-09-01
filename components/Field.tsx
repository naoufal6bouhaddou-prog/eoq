'use client';

import { useEffect, useState } from 'react';

import { formatForInput, parseNumber } from '@/lib/format';

import { useSettings } from './Settings';

export interface FieldProps {
  id: string;
  /** The mathematical variable, set in the stripe down the left of the rail. */
  symbol?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  /** Resolved message. Held back until the field has been left at least once. */
  error?: string | null;
  /** Reveal held-back errors, when the whole form is being checked at once. */
  revealErrors?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * One text input. Deliberately not <input type="number">: its spinners and its
 * locale handling differ between browsers, and this tool has to accept both a
 * comma and a point as the decimal mark.
 *
 * Validation messages appear on blur, not on keystroke, so the field does not
 * argue with someone halfway through typing. Leaving the field also rewrites
 * what is in it into the conventions of the active locale.
 */
export function Field({
  id,
  symbol,
  label,
  value,
  onChange,
  unit,
  error,
  revealErrors = false,
  disabled = false,
  placeholder,
}: FieldProps) {
  const { locale } = useSettings();
  const [touched, setTouched] = useState(false);

  // A field the user has not reached yet still shows its error once the whole
  // form is checked, and goes quiet again if the value is corrected.
  useEffect(() => {
    if (revealErrors) setTouched(true);
  }, [revealErrors]);

  const showError = error != null && error !== '' && touched;
  const errorId = `${id}-error`;

  function handleBlur() {
    setTouched(true);
    const parsed = parseNumber(value, locale);
    if (parsed !== null) {
      const tidy = formatForInput(parsed, locale);
      if (tidy !== value) onChange(tidy);
    }
  }

  return (
    <div className="grid grid-cols-[1.9rem_1fr] gap-x-2">
      <div className="col-start-2 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="t-label">
          {label}
        </label>
        {unit === undefined || unit === '' ? null : (
          <span className="unit shrink-0">{unit}</span>
        )}
      </div>

      <div className="col-start-1 row-start-2 flex items-center justify-end pr-1">
        {symbol === undefined || symbol === '' ? null : (
          <span aria-hidden="true" className="t-body italic text-[color:var(--c-ink-muted)]">
            {symbol}
          </span>
        )}
      </div>

      <div className="col-start-2 row-start-2">
        <input
          id={id}
          className="field-input t-body"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={showError ? 'true' : undefined}
          aria-describedby={showError ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          onBlur={handleBlur}
        />
      </div>

      {showError ? (
        <p id={errorId} className="col-start-2 row-start-3 t-micro pt-1 text-[color:var(--c-signal)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
