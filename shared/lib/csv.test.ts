import { describe, expect, it } from 'vitest';

import { csvFilename, escapeCsvField, toCsv } from './csv';

describe('escaping', () => {
  it('leaves a plain field alone', () => {
    expect(escapeCsvField('707.11', ',')).toBe('707.11');
    expect(escapeCsvField('Annual demand', ',')).toBe('Annual demand');
  });

  it('quotes a field containing the separator', () => {
    expect(escapeCsvField('1,000', ',')).toBe('"1,000"');
    // The same text is harmless under a semicolon separator.
    expect(escapeCsvField('1,000', ';')).toBe('1,000');
    expect(escapeCsvField('a;b', ';')).toBe('"a;b"');
  });

  it('doubles a quote inside a field, and quotes the field', () => {
    expect(escapeCsvField('say "hello"', ',')).toBe('"say ""hello"""');
  });

  it('quotes a field containing a line break', () => {
    expect(escapeCsvField('one\ntwo', ',')).toBe('"one\ntwo"');
    expect(escapeCsvField('one\rtwo', ',')).toBe('"one\rtwo"');
  });
});

describe('writing a file', () => {
  const sections = [
    { title: 'Inputs', header: ['Field', 'Value'], rows: [['Annual demand', '10000']] },
    { title: 'Results', header: ['Field', 'Value'], rows: [['Q*', '707.11']] },
  ];

  it('starts with a byte order mark, so Excel reads UTF-8 as UTF-8', () => {
    expect(toCsv(sections, 'en').charCodeAt(0)).toBe(0xfeff);
  });

  it('separates fields with a comma in English', () => {
    const text = toCsv(sections, 'en');
    expect(text).toContain('Field,Value');
    expect(text).toContain('Annual demand,10000');
  });

  it('separates fields with a semicolon in French, where the comma is decimal', () => {
    const text = toCsv([{ title: 'Résultats', header: ['Champ', 'Valeur'], rows: [['Q*', '707,11']] }], 'fr');
    expect(text).toContain('Champ;Valeur');
    // The decimal comma survives unquoted, because it is not the separator.
    expect(text).toContain('Q*;707,11');
  });

  it('ends every row with CRLF', () => {
    const text = toCsv(sections, 'en');
    expect(text.endsWith('\r\n')).toBe(true);
    expect(text.split('\r\n').filter((line) => line !== '')).toHaveLength(6);
  });

  it('puts a blank line between sections but not before the first', () => {
    const lines = toCsv(sections, 'en').split('\r\n');
    expect(lines[0]).toBe(`${String.fromCharCode(0xfeff)}Inputs`);
    expect(lines[3]).toBe('');
    expect(lines[4]).toBe('Results');
  });

  it('writes a section with no header', () => {
    const text = toCsv([{ title: 'Notes', rows: [['a'], ['b']] }], 'en');
    expect(text).toContain('Notes\r\na\r\nb\r\n');
  });
});

describe('the file name', () => {
  it('sorts by date and carries no spaces', () => {
    expect(csvFilename(new Date(2026, 8, 1))).toBe('inventory-ordering-2026-09-01.csv');
    expect(csvFilename(new Date(2026, 11, 25))).toBe('inventory-ordering-2026-12-25.csv');
  });
});
