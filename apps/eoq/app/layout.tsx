import type { Metadata } from 'next';
import { Archivo, Overpass_Mono } from 'next/font/google';

import { fr } from '@/lib/i18n/fr';

import './globals.css';

/**
 * Two families, doing two different jobs.
 *
 * Overpass Mono carries the figures. It descends from Overpass, which is drawn
 * from the US Federal Highway Administration's signage alphabet: a lineage of
 * type meant to be read quickly and without ambiguity off an instrument or a
 * sign. Its punctuation is tight for a monospace, which matters when a column
 * of money runs to two decimals and a grouping separator.
 *
 * Archivo carries the words. A grotesque built for dense print, sturdy at
 * small sizes, and a different genre from a signage mono rather than a
 * near-neighbour of it.
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
 * advertises itself rather than this one. Social crawlers resolve the image
 * against it: a relative path alone gives them nothing to fetch.
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eoq.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: fr.meta.title,
  description: fr.meta.description,
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Supply Chain Tools',
    title: fr.meta.title,
    description: fr.meta.description,
    url: '/',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'La courbe de coût de la quantité économique de commande, avec Q* marqué à son minimum.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: fr.meta.title,
    description: fr.meta.description,
    images: ['/og.png'],
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
