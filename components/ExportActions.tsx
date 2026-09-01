'use client';

import { useState } from 'react';

import { csvFilename, toCsv } from '@/lib/csv';
import type { Derived } from '@/lib/derive';
import { reportSections } from '@/lib/report';
import type { ToolState } from '@/lib/state';

import { useSettings } from './Settings';

export interface ExportActionsProps {
  state: ToolState;
  derived: Derived;
}

/**
 * Download the working, share it, or print it.
 *
 * The PDF route is the print stylesheet and window.print(), not a PDF library:
 * it is lighter, it keeps the chart as vector rather than as a raster, and the
 * browser's own dialogue already offers "save as PDF".
 */
export function ExportActions({ state, derived }: ExportActionsProps) {
  const { locale, currency, t } = useSettings();
  const [copied, setCopied] = useState(false);

  function downloadCsv() {
    const text = toCsv(reportSections({ state, derived, t, locale, currency }), locale);
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = csvFilename(new Date());
    document.body.append(link);
    link.click();
    link.remove();

    // Revoking straight away can cancel the download before the browser has
    // finished reading the blob. Release it on the next turn instead.
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // A browser that refuses clipboard access still has the URL bar.
    }
  }

  return (
    <>
      <button type="button" className="btn btn-quiet t-micro" onClick={copyLink}>
        {copied ? t.actions.linkCopied : t.actions.copyLink}
      </button>
      <button
        type="button"
        className="btn t-micro"
        onClick={downloadCsv}
        data-testid="download-csv"
      >
        {t.actions.downloadCsv}
      </button>
      <button type="button" className="btn t-micro" onClick={() => window.print()}>
        {t.actions.print}
      </button>
    </>
  );
}
