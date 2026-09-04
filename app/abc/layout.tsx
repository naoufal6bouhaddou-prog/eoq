import type { Metadata } from 'next';

import { fr } from '@/lib/abc/i18n/fr';

/**
 * Metadata only. The page itself runs in the browser, so it cannot export
 * this, and the root layout owns the document, the fonts and the stylesheet.
 * French, like the root, because that is the majority audience here.
 */
export const metadata: Metadata = {
  title: fr.meta.title,
  description: fr.meta.description,
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: fr.app.family,
    title: fr.meta.title,
    description: fr.meta.description,
    url: '/abc',
  },
};

export default function AbcLayout({ children }: { children: React.ReactNode }) {
  return children;
}
