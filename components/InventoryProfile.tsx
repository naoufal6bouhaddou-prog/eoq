'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { sampleInventoryProfile } from '@/lib/eoq';
import { formatQuantity } from '@/lib/format';
import { clamp, linearScale, niceTicks } from '@/lib/scale';

import { useSettings } from './Settings';

export interface InventoryProfileProps {
  /** Q: the quantity each replenishment brings in. */
  orderQuantity: number;
  /** Demand per period, in the same period as the lead time. */
  demandRate: number;
  safetyStock: number;
  reorderPoint: number;
  leadTime: number;
  /** What one period is called: days or weeks. */
  periodLabel: string;
  /** True when a reorder point is being calculated, not assumed to be zero. */
  hasReorderPoint: boolean;
}

const PAD = { top: 18, right: 16, bottom: 30, left: 58 };
const CYCLES = 3;

/**
 * Inventory over time: the sawtooth.
 *
 * This is the diagram the subject is taught with, and the tool already holds
 * every quantity it needs. It earns its place by proving the reorder point
 * rather than restating it: because ROP = d·L + SS, the falling line crosses
 * the reorder mark exactly one lead time before it reaches the buffer, so the
 * delivery lands as the safety stock is reached. Someone who does not believe
 * the number can read that off the picture.
 *
 * The reorder line is the only marked colour here, and it is the same red that
 * marks the reorder point in the results.
 */
export function InventoryProfile({
  orderQuantity,
  demandRate,
  safetyStock,
  reorderPoint,
  leadTime,
  periodLabel,
  hasReorderPoint,
}: InventoryProfileProps) {
  const { locale, t } = useSettings();
  const wrapper = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);

  useEffect(() => {
    const element = wrapper.current;
    if (element === null) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) setWidth(Math.max(280, entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const height = Math.round(clamp(width * 0.34, 190, 280));

  const view = useMemo(() => {
    const profile = sampleInventoryProfile(
      orderQuantity,
      demandRate,
      safetyStock,
      reorderPoint,
      leadTime,
      CYCLES,
    );

    const plotLeft = PAD.left;
    const plotRight = width - PAD.right;
    const plotTop = PAD.top;
    const plotBottom = height - PAD.bottom;

    const x = linearScale([0, profile.horizon], [plotLeft, plotRight]);
    const y = linearScale([0, profile.peak * 1.08], [plotBottom, plotTop]);

    return {
      profile,
      plotLeft,
      plotRight,
      plotTop,
      plotBottom,
      x,
      y,
      path: profile.points
        .map(
          (point, index) =>
            `${index === 0 ? 'M' : 'L'}${x(point.time).toFixed(2)} ${y(point.level).toFixed(2)}`,
        )
        .join(' '),
      timeTicks: niceTicks(0, profile.horizon, width < 520 ? 3 : 6),
      levelTicks: niceTicks(0, profile.peak * 1.08, 3),
    };
  }, [orderQuantity, demandRate, safetyStock, reorderPoint, leadTime, width, height]);

  const { profile } = view;
  const firstCycle = profile.cycles[0];
  const showReorderMarks = hasReorderPoint && leadTime > 0 && firstCycle !== undefined;

  const events = useMemo(
    () =>
      profile.cycles.flatMap((cycle, index) => {
        const rows = [
          { key: `start-${index}`, label: t.profile.eventStart, time: cycle.start, level: profile.peak },
        ];
        if (showReorderMarks) {
          rows.push({
            key: `order-${index}`,
            label: t.profile.eventOrder,
            time: cycle.orderPlacedAt,
            level: profile.reorderPoint,
          });
        }
        rows.push({
          key: `delivery-${index}`,
          label: t.profile.eventDelivery,
          time: cycle.end,
          level: profile.low,
        });
        return rows;
      }),
    [profile, showReorderMarks, t],
  );

  return (
    <section className="panel" aria-label={t.profile.title}>
      <div className="panel-head">
        <h2 className="t-label">{t.profile.title}</h2>
        <p className="t-micro max-w-[62ch] text-[color:var(--text-2)]">
          {showReorderMarks ? t.profile.caption : t.profile.captionPlain}
        </p>
      </div>

      <div ref={wrapper} className="px-2 pb-1">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={t.profile.title}
          className="block"
        >
          {view.levelTicks.map((tick) => (
            <g key={`level-${tick}`}>
              <line
                x1={view.plotLeft}
                x2={view.plotRight}
                y1={view.y(tick)}
                y2={view.y(tick)}
                stroke="var(--grid)"
                strokeWidth={1}
              />
              <text
                x={view.plotLeft - 8}
                y={view.y(tick)}
                dy="0.32em"
                textAnchor="end"
                className="chart-tick"
              >
                {formatQuantity(tick, locale)}
              </text>
            </g>
          ))}

          {view.timeTicks.map((tick) => (
            <text
              key={`time-${tick}`}
              x={view.x(tick)}
              y={view.plotBottom + 14}
              textAnchor="middle"
              className="chart-tick"
            >
              {formatQuantity(tick, locale)}
            </text>
          ))}

          <text
            x={view.plotRight}
            y={view.plotBottom + 14}
            textAnchor="end"
            className="chart-label"
          >
            {periodLabel}
          </text>

          <line
            x1={view.plotLeft}
            x2={view.plotRight}
            y1={view.plotBottom}
            y2={view.plotBottom}
            stroke="var(--line-strong)"
            strokeWidth={1}
          />
          <line
            x1={view.plotLeft}
            x2={view.plotLeft}
            y1={view.plotTop}
            y2={view.plotBottom}
            stroke="var(--line-strong)"
            strokeWidth={1}
          />

          {/* Safety stock: the floor the cycle is designed never to break. */}
          {safetyStock > 0 ? (
            <g>
              <line
                x1={view.plotLeft}
                x2={view.plotRight}
                y1={view.y(safetyStock)}
                y2={view.y(safetyStock)}
                stroke="var(--trace-2)"
                strokeWidth={1}
                strokeDasharray="2 3"
              />
              <text
                x={view.plotLeft + 4}
                y={view.y(safetyStock) - 4}
                className="chart-label"
                data-testid="profile-safety-stock-label"
              >
                {t.results.safetyStock}
              </text>
            </g>
          ) : null}

          {/* The reorder point: the one marked colour in this diagram. */}
          {showReorderMarks ? (
            <g>
              <line
                x1={view.plotLeft}
                x2={view.plotRight}
                y1={view.y(profile.reorderPoint)}
                y2={view.y(profile.reorderPoint)}
                stroke="var(--signal)"
                strokeWidth={1}
                data-testid="profile-reorder-line"
              />
              <text
                x={view.plotLeft + 4}
                y={view.y(profile.reorderPoint) - 4}
                className="chart-mark"
              >
                {t.results.reorderPoint}
              </text>
            </g>
          ) : null}

          <path
            d={view.path}
            fill="none"
            stroke="var(--trace)"
            strokeWidth={1.75}
            strokeLinejoin="round"
            data-testid="profile-trace"
          />

          {/* One cycle is annotated, not all three: the pattern repeats and a
              second copy of the labels would only be noise. */}
          {showReorderMarks && firstCycle !== undefined ? (
            <g>
              <circle
                cx={view.x(firstCycle.orderPlacedAt)}
                cy={view.y(profile.reorderPoint)}
                r={3.5}
                fill="var(--signal)"
                data-testid="profile-order-point"
              />
              <line
                x1={view.x(firstCycle.orderPlacedAt)}
                x2={view.x(firstCycle.orderPlacedAt)}
                y1={view.y(profile.reorderPoint)}
                y2={view.plotBottom}
                stroke="var(--signal)"
                strokeWidth={1}
                strokeDasharray="2 3"
              />
              <line
                x1={view.x(firstCycle.end)}
                x2={view.x(firstCycle.end)}
                y1={view.plotTop}
                y2={view.plotBottom}
                stroke="var(--line-strong)"
                strokeWidth={1}
                strokeDasharray="2 3"
              />

              {/* The lead time, drawn as the span it actually occupies. */}
              <line
                x1={view.x(firstCycle.orderPlacedAt)}
                x2={view.x(firstCycle.end)}
                y1={view.plotTop + 6}
                y2={view.plotTop + 6}
                stroke="var(--text-2)"
                strokeWidth={1}
              />
              <text
                x={(view.x(firstCycle.orderPlacedAt) + view.x(firstCycle.end)) / 2}
                y={view.plotTop + 1}
                textAnchor="middle"
                className="chart-label"
              >
                {t.profile.leadTimeSpan}
              </text>
              {/* Inside the plot, not under the axis: the axis line is where
                  the time ticks live and the two would collide. */}
              <text
                x={view.x(firstCycle.orderPlacedAt) + 4}
                y={view.plotBottom - 6}
                textAnchor="start"
                className="chart-label"
              >
                {t.profile.orderPlaced}
              </text>
            </g>
          ) : null}
        </svg>
      </div>

      <table className="sr-only">
        <caption>{t.profile.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{t.profile.tableEvent}</th>
            <th scope="col">{t.profile.tableTime}</th>
            <th scope="col">{t.profile.tableLevel}</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.key}>
              <td>{event.label}</td>
              <td>
                {formatQuantity(event.time, locale, 1)} {periodLabel}
              </td>
              <td>{formatQuantity(event.level, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
