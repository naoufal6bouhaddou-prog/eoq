'use client';

import type { VariabilityMode } from '@/lib/eoq';
import type { FieldIssues } from '@/lib/derive';
import { currencySymbol } from '@/lib/format';
import type { HoldingMode, PeriodUnit, ToolState } from '@/lib/state';

import { ChoiceGroup, RailSection, SectionToggle } from './Controls';
import { Field } from './Field';
import { useSettings } from './Settings';

export interface InputRailProps {
  state: ToolState;
  patch: (patch: Partial<ToolState>) => void;
  issues: FieldIssues;
  revealErrors: boolean;
}

/**
 * The input rail. A stripe of mathematical symbols runs down its left edge, so
 * it reads the way the variables list in a paper does, and every field box
 * shares one left and one right edge.
 */
export function InputRail({ state, patch, issues, revealErrors }: InputRailProps) {
  const { locale, currency, t } = useSettings();
  const symbol = currencySymbol(currency, locale);
  const byRate = state.holdingMode === 'rate';
  const perPeriod = state.periodUnit === 'week' ? t.units.unitsPerWeek : t.units.unitsPerDay;
  const periods = state.periodUnit === 'week' ? t.units.weeks : t.units.days;
  const needsDemandSigma = state.variabilityMode !== 'lead-time';
  const needsLeadTimeSigma = state.variabilityMode !== 'demand';

  const message = (field: keyof FieldIssues): string | null => {
    const code = issues[field];
    return code === undefined ? null : t.errors[code];
  };

  return (
    <div className="space-y-4">
      <RailSection title={t.sections.demandAndCost}>
        <Field
          id="annual-demand"
          symbol={t.fields.annualDemand.symbol}
          label={t.fields.annualDemand.label}
          unit={t.units.unitsPerYear}
          value={state.annualDemand}
          onChange={(value) => patch({ annualDemand: value })}
          error={message('annualDemand')}
          revealErrors={revealErrors}
        />

        <Field
          id="order-cost"
          symbol={t.fields.orderCost.symbol}
          label={t.fields.orderCost.label}
          unit={`${symbol} ${t.units.perOrder}`}
          value={state.orderCost}
          onChange={(value) => patch({ orderCost: value })}
          error={message('orderCost')}
          revealErrors={revealErrors}
        />

        <ChoiceGroup<HoldingMode>
          name="holding-mode"
          legend={t.holdingMode.legend}
          value={state.holdingMode}
          onChange={(value) => patch({ holdingMode: value })}
          choices={[
            { value: 'perUnit', label: t.holdingMode.perUnit },
            { value: 'rate', label: t.holdingMode.rate },
          ]}
        />

        {byRate ? (
          <>
            <Field
              id="holding-rate"
              symbol={t.fields.holdingRate.symbol}
              label={t.fields.holdingRate.label}
              unit={t.units.percentOfUnitCost}
              value={state.holdingRate}
              onChange={(value) => patch({ holdingRate: value })}
              error={message('holdingRate')}
              revealErrors={revealErrors}
            />
            <Field
              id="unit-cost"
              symbol={t.fields.unitCost.symbol}
              label={t.fields.unitCost.label}
              unit={`${symbol} ${t.units.perUnit}`}
              value={state.unitCost}
              onChange={(value) => patch({ unitCost: value })}
              error={message('unitCost')}
              revealErrors={revealErrors}
            />
          </>
        ) : (
          <>
            <Field
              id="holding-cost"
              symbol={t.fields.holdingCostPerUnit.symbol}
              label={t.fields.holdingCostPerUnit.label}
              unit={`${symbol} ${t.units.perUnitYear}`}
              value={state.holdingCostPerUnit}
              onChange={(value) => patch({ holdingCostPerUnit: value })}
              error={message('holdingCostPerUnit')}
              revealErrors={revealErrors}
            />
            <Field
              id="unit-cost"
              symbol={t.fields.unitCost.symbol}
              label={t.fields.unitCost.label}
              unit={`${symbol} ${t.units.perUnit}`}
              value={state.unitCost}
              onChange={(value) => patch({ unitCost: value })}
              error={message('unitCost')}
              revealErrors={revealErrors}
            />
          </>
        )}
      </RailSection>

      <RailSection title={t.sections.workingYear}>
        <Field
          id="days-per-year"
          label={t.fields.daysPerYear.label}
          unit={t.units.days}
          value={state.daysPerYear}
          onChange={(value) => patch({ daysPerYear: value })}
          error={message('daysPerYear')}
          revealErrors={revealErrors}
        />
      </RailSection>

      <RailSection title={t.sections.casePack}>
        <Field
          id="rounding-multiple"
          label={t.fields.roundingMultiple.label}
          unit={t.units.units}
          value={state.roundingMultiple}
          onChange={(value) => patch({ roundingMultiple: value })}
          error={message('roundingMultiple')}
          revealErrors={revealErrors}
        />
      </RailSection>

      <RailSection
        title={t.sections.reorder}
        action={
          <SectionToggle
            id="reorder-enabled"
            label={t.toggles.reorderOn}
            checked={state.reorderEnabled}
            onChange={(checked) => patch({ reorderEnabled: checked })}
          />
        }
      >
        {state.reorderEnabled ? (
          <>
            <ChoiceGroup<VariabilityMode>
              name="variability-mode"
              legend={t.variability.legend}
              value={state.variabilityMode}
              onChange={(value) => patch({ variabilityMode: value })}
              stack
              choices={[
                { value: 'demand', label: t.variability.demand },
                { value: 'lead-time', label: t.variability.leadTime },
                { value: 'both', label: t.variability.both },
              ]}
            />

            <ChoiceGroup<PeriodUnit>
              name="period-unit"
              legend={t.period.legend}
              value={state.periodUnit}
              onChange={(value) => patch({ periodUnit: value })}
              choices={[
                { value: 'day', label: t.period.day },
                { value: 'week', label: t.period.week },
              ]}
            />

            <Field
              id="average-demand"
              symbol={t.fields.averageDemand.symbol}
              label={t.fields.averageDemand.label}
              unit={perPeriod}
              value={state.averageDemand}
              onChange={(value) => patch({ averageDemand: value })}
              error={message('averageDemand')}
              revealErrors={revealErrors}
            />

            <Field
              id="lead-time"
              symbol={t.fields.leadTime.symbol}
              label={t.fields.leadTime.label}
              unit={periods}
              value={state.leadTime}
              onChange={(value) => patch({ leadTime: value })}
              error={message('leadTime')}
              revealErrors={revealErrors}
            />

            {needsDemandSigma ? (
              <Field
                id="demand-std-dev"
                symbol={t.fields.demandStdDev.symbol}
                label={t.fields.demandStdDev.label}
                unit={perPeriod}
                value={state.demandStdDev}
                onChange={(value) => patch({ demandStdDev: value })}
                error={message('demandStdDev')}
                revealErrors={revealErrors}
              />
            ) : null}

            {needsLeadTimeSigma ? (
              <Field
                id="lead-time-std-dev"
                symbol={t.fields.leadTimeStdDev.symbol}
                label={t.fields.leadTimeStdDev.label}
                unit={periods}
                value={state.leadTimeStdDev}
                onChange={(value) => patch({ leadTimeStdDev: value })}
                error={message('leadTimeStdDev')}
                revealErrors={revealErrors}
              />
            ) : null}

            <Field
              id="cycle-service-level"
              symbol={t.fields.cycleServiceLevel.symbol}
              label={t.fields.cycleServiceLevel.label}
              unit={t.units.percent}
              value={state.cycleServiceLevel}
              onChange={(value) => patch({ cycleServiceLevel: value })}
              error={message('cycleServiceLevel')}
              revealErrors={revealErrors}
            />
          </>
        ) : null}
      </RailSection>
    </div>
  );
}
