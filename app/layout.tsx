import type { Metadata } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';

import { fr } from '@/lib/i18n/fr';

import './globals.css';

/**
 * One family, load-bearing. IBM Plex Mono holds every figure in every table,
 * where column alignment is the point. Italic is loaded because the symbol
 * stripe sets mathematical variables in italic, as they are set in print.
 */
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-plex-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
});

export const metadata: Metadata = {
  title: fr.meta.title,
  description: fr.meta.description,
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // lang is corrected on the client once the stored or requested locale is
  // known; French is the default because that is the majority audience here.
  return (
    <html lang="fr" className={plexMono.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
