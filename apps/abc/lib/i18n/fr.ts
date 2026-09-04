import type { AbcDictionary } from './en';

/**
 * French dictionary. Typed against the English one, so every key is present
 * and no key is invented.
 */
export const fr: AbcDictionary = {
  meta: {
    title: 'Analyse ABC des stocks',
    description:
      'Classer les articles stockés par valeur de consommation annuelle et les répartir en classes A, B et C, dans le navigateur.',
  },

  app: {
    family: 'Supply Chain Tools',
    tool: 'Analyse ABC',
    language: 'Langue',
    currency: 'Devise',
    siblings: 'Outils',
    ordering: 'Commande de stock',
  },

  intro: {
    title: 'Analyse ABC des stocks',
    lead: "L'analyse ABC classe chaque article stocké par sa valeur de consommation annuelle, puis répartit la liste classée en trois classes.",
  },

  sections: {
    chart: 'Diagramme de Pareto',
    summary: 'Classes',
    table: 'Articles',
  },

  actions: {
    loadExample: "Charger l'exemple",
    clearAll: 'Tout effacer',
    addRow: 'Ajouter une ligne',
    removeRow: (name: string) => (name === '' ? 'Supprimer cette ligne' : `Supprimer ${name}`),
  },

  table: {
    columns: {
      name: 'Article',
      annualUsage: 'Consommation annuelle',
      unitCost: 'Coût unitaire',
      annualValue: 'Valeur annuelle',
      valueShare: 'Part',
      cumulativeShare: 'Cumul',
      abcClass: 'Classe',
    },
    total: 'Total',
    namePlaceholder: "Nom de l'article",
    rowCount: (count: number) => (count === 1 ? '1 article' : `${count} articles`),
  },

  summary: {
    columns: {
      abcClass: 'Classe',
      itemCount: 'Articles',
      itemShare: '% des articles',
      valueShare: '% de la valeur',
    },
  },

  chart: {
    title: 'Valeur de consommation annuelle par article, par rang, avec la part cumulée',
    axisValue: 'Valeur annuelle',
    axisCumulative: 'Part cumulée',
    axisRank: 'Rang',
    readoutItem: 'Article',
    readoutValue: 'Valeur annuelle',
    readoutCumulative: 'Cumul',
    hint: 'Pointez une barre pour la lire.',
    tableCaption:
      'Chaque article par rang, avec sa valeur annuelle, sa classe et sa part cumulée',
  },

  empty: {
    title: 'Rien à analyser pour le moment',
    message:
      "Saisissez le nom d'un article, la quantité consommée en un an et le coût d'une unité. Le diagramme et les classes apparaissent au fur et à mesure.",
    exampleHint: "Charger l'exemple remplit le tableau avec une année de fournitures de café.",
  },

  units: {
    perYear: 'unités/an',
    items: 'articles',
  },

  a11y: {
    skipToTable: 'Aller au tableau des articles',
    chartRegion: 'Diagramme de Pareto',
    classOf: (abcClass: string) => `Classe ${abcClass}`,
  },
};
