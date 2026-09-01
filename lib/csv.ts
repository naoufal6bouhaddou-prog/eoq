/**
 * CSV writing.
 *
 * The awkward part of this format is not the commas, it is Excel. A French
 * Excel reads "," as a decimal mark, so a comma-separated file full of French
 * numbers lands in a single column; the separator therefore follows the locale.
 * Accented headings need a byte order mark or Excel reads them as mojibake.
 * And a grouped figure carrying a narrow no-break space is not parsed as a
 * number at all, so exported figures are written ungrouped.
 */

import { csvSeparator, type Locale } from './format';

export interface CsvSection {
  title: string;
  header?: string[];
  rows: string[][];
}

/** Excel needs this to read a UTF-8 file as UTF-8. */
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

/** Excel is happiest with CRLF, and every other reader tolerates it. */
const ROW_SEPARATOR = '\r\n';

/** Quote a field only when it needs it, doubling any quote inside. */
export function escapeCsvField(value: string, separator: string): string {
  const needsQuotes =
    value.includes(separator) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r');
  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Render sections as one file, each with its title on its own line and a blank
 * line between, which is what a spreadsheet reader expects of a report rather
 * than of a single table.
 */
export function toCsv(sections: readonly CsvSection[], locale: Locale): string {
  const separator = csvSeparator(locale);
  const lines: string[] = [];

  sections.forEach((section, index) => {
    if (index > 0) lines.push('');
    lines.push(escapeCsvField(section.title, separator));
    if (section.header !== undefined) {
      lines.push(section.header.map((field) => escapeCsvField(field, separator)).join(separator));
    }
    for (const row of section.rows) {
      lines.push(row.map((field) => escapeCsvField(field, separator)).join(separator));
    }
  });

  return BYTE_ORDER_MARK + lines.join(ROW_SEPARATOR) + ROW_SEPARATOR;
}

/** A filename that sorts by date and carries no spaces. */
export function csvFilename(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `inventory-ordering-${year}-${month}-${day}.csv`;
}
