import type { Metadata } from 'next';
import { Archivo, Overpass_Mono } from 'next/font/google';

import { fr } from '@/lib/i18n/fr';

import './globals.css';

/**
 * Two families, doing two different jobs. The same pair the sibling tool
 * loads, because the division is the design system's and not this page's:
 * mono carries every figure, Archivo carries every word, and neither ever
 * does the other's job.
 */
const mono = Overpass_Mono({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-figure',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
});

const text = Archivo({
  subsets: ['latin'],
  variable: '--font-text',
  display: 'swap',
  fallback: ['system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

/**
 * The canonical address, overridable so a fork or a preview deployment
 * advertises itself rather than this one.
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://abc-analyser.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: fr.meta.title,
  description: fr.meta.description,
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: fr.app.family,
    title: fr.meta.title,
    description: fr.meta.description,
    url: '/',
  },
  twitter: {
    card: 'summary',
    title: fr.meta.title,
    description: fr.meta.description,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // lang is corrected on the client once the stored or requested locale is
  // known; French is the default because that is the majority audience here.
  return (
    <html lang="fr" className={`${mono.variable} ${text.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
