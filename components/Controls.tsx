'use client';

import type { ReactNode } from 'react';

export interface Choice<T extends string> {
  value: T;
  label: string;
}

/**
 * A set of mutually exclusive options, built on real radio inputs so arrow
 * keys, screen readers and form semantics all work, with the radio itself
 * hidden and the label carrying the pressed state.
 */
export function ChoiceGroup<T extends string>({
  name,
  legend,
  choices,
  value,
  onChange,
  stack = false,
}: {
  name: string;
  legend: string;
  choices: ReadonlyArray<Choice<T>>;
  value: T;
  onChange: (value: T) => void;
  stack?: boolean;
}) {
  return (
    <fieldset className="grid grid-cols-[1.9rem_1fr] gap-x-2">
      <legend className="sr-only">{legend}</legend>
      <p aria-hidden="true" className="col-start-2 t-label mb-1">
        {legend}
      </p>
      <div className={`col-start-2 seg t-micro ${stack ? 'seg-stack' : ''}`}>
        {choices.map((choice) => {
          const id = `${name}-${choice.value}`;
          const active = choice.value === value;
          return (
            <label key={choice.value} htmlFor={id} data-active={active}>
              <input
                id={id}
                className="sr-only"
                type="radio"
                name={name}
                value={choice.value}
                checked={active}
                onChange={() => onChange(choice.value)}
              />
              {choice.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** A section on/off switch, built on a checkbox. */
export function SectionToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <span className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        className="size-3.5 accent-[var(--text)]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label htmlFor={id} className="t-micro cursor-pointer text-[color:var(--text-2)]">
        {label}
      </label>
    </span>
  );
}

/** A titled block in the input rail. One rule above it, nothing else. */
export function RailSection({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="border-t border-[color:var(--line)] pt-3 first:border-t-0 first:pt-0">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-label">{title}</h2>
        {action}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}
