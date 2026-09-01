import type { Dictionary } from './en';

/**
 * French dictionary, written in the vocabulary a French-language supply chain
 * course actually uses: quantité économique de commande, coût de passation,
 * coût de possession, point de commande, stock de sécurité, taux de service.
 * Typed as Dictionary, so a missing key fails the build.
 */
export const fr: Dictionary = {
  meta: {
    title: 'Calculateur de commande de stock',
    description:
      'Quantité économique de commande, point de commande et remises sur quantité, calculés dans le navigateur.',
  },

  app: {
    name: 'Calculateur de commande de stock',
    language: 'Langue',
    currency: 'Devise',
    theme: 'Thème',
    themeLight: 'Clair',
    themeDark: 'Sombre',
  },

  actions: {
    loadExample: 'Charger un exemple',
    clear: 'Vider les champs',
    copyLink: 'Copier le lien vers ces données',
    linkCopied: 'Lien copié',
    downloadCsv: 'Télécharger le CSV',
    print: 'Imprimer ou enregistrer en PDF',
    addTier: 'Ajouter un palier',
    removeTier: 'Supprimer le palier',
  },

  sections: {
    demandAndCost: 'Demande et coûts',
    workingYear: 'Année de travail',
    casePack: 'Conditionnement',
    reorder: 'Point de commande',
    breaks: 'Remises sur quantité',
    results: 'Résultats',
    chart: 'Courbe de coût',
    discounts: 'Comparaison des remises à tarif uniforme',
    penalty: 'Coût d’une quantité de commande erronée',
    sensitivity: 'Sensibilité aux erreurs d’estimation',
  },

  fields: {
    annualDemand: { symbol: 'D', label: 'Demande annuelle' },
    orderCost: { symbol: 'S', label: 'Coût de passation par commande' },
    holdingCostPerUnit: { symbol: 'H', label: 'Coût de possession unitaire' },
    holdingRate: { symbol: 'i', label: 'Taux de possession' },
    unitCost: { symbol: 'C', label: 'Coût d’achat unitaire' },
    daysPerYear: { symbol: '', label: 'Jours ouvrés par an' },
    roundingMultiple: { symbol: '', label: 'Commander par multiples de' },
    averageDemand: { symbol: 'd̄', label: 'Demande moyenne par période' },
    leadTime: { symbol: 'L', label: 'Délai de livraison' },
    demandStdDev: { symbol: 'σd', label: 'Écart-type de la demande par période' },
    leadTimeStdDev: { symbol: 'σL', label: 'Écart-type du délai' },
    cycleServiceLevel: { symbol: 'TS', label: 'Taux de service par cycle' },
  },

  holdingMode: {
    legend: 'Coût de possession exprimé en',
    perUnit: 'Montant par unité',
    rate: 'Taux sur le coût unitaire',
    derived: 'H = i × C',
  },

  variability: {
    legend: 'Ce qui varie',
    demand: 'Demande variable, délai constant',
    leadTime: 'Délai variable, demande constante',
    both: 'Les deux varient',
  },

  period: {
    legend: 'Période',
    day: 'Jour',
    week: 'Semaine',
    days: 'jours',
    weeks: 'semaines',
  },

  toggles: {
    reorderOn: 'Calculer un point de commande',
    discountsOn: 'Appliquer un barème de remises',
  },

  results: {
    quantity: 'Quantité économique de commande',
    quantityShort: 'Q*',
    ordersPerYear: 'Commandes par an',
    daysBetween: 'Jours entre deux commandes',
    orderingCost: 'Coût de passation',
    holdingCost: 'Coût de possession',
    cycleHoldingCost: 'Possession du stock de cycle',
    safetyStockHoldingCost: 'Possession du stock de sécurité',
    relevantCost: 'Coût total pertinent',
    relevantCostShort: 'CTP',
    purchaseCost: 'Coût d’achat',
    totalCost: 'Coût annuel total',
    averageInventory: 'Stock moyen',
    safetyStock: 'Stock de sécurité',
    reorderPoint: 'Point de commande',
    safetyFactor: 'Coefficient de sécurité',
    sigmaDdlt: 'Écart-type sur le délai',
    demandDuringLeadTime: 'Demande pendant le délai',
    practicalQuantity: 'Quantité arrondie',
    penalty: 'Coût de l’arrondi',
    balanced: 'À Q*, le coût de passation égale le coût de possession',
    notBalanced: 'Les deux coûts diffèrent, cette quantité n’est donc pas Q*',
    closedForm: 'CTP = √(2·D·S·H)',
    orderWhole: 'Commander en unités entières : arrondir à',
    serviceLevelNote:
      'Probabilité de ne pas être en rupture pendant un cycle de réapprovisionnement. Ce n’est pas le taux de satisfaction.',
  },

  units: {
    units: 'unités',
    unitsPerYear: 'unités/an',
    unitsPerDay: 'unités/jour',
    unitsPerWeek: 'unités/semaine',
    ordersPerYear: 'commandes/an',
    days: 'jours',
    weeks: 'semaines',
    perOrder: 'par commande',
    perUnitYear: 'par unité/an',
    perUnit: 'par unité',
    perYear: 'par an',
    percent: '%',
    percentOfUnitCost: '% du coût unitaire',
  },

  discounts: {
    model:
      'Modèle à tarif uniforme : franchir un palier retarife la commande entière. Les remises progressives suivent une autre logique et ne sont pas calculées ici.',
    holdingNote:
      'Le coût de possession suit le prix du palier, chaque palier a donc son propre H.',
    roundingNote:
      'Le multiple de conditionnement s’applique au résultat classique ci-dessus, pas à cette comparaison.',
    columns: {
      tier: 'Palier',
      range: 'Plage de quantité',
      unitCost: 'Coût unitaire',
      tierEoq: 'QEC du palier',
      candidate: 'Quantité à commander',
      purchase: 'Achat',
      ordering: 'Passation',
      holding: 'Possession',
      total: 'Coût annuel total',
      status: 'Motif',
    },
    status: {
      inRange: 'QEC dans la plage',
      raised: 'Relevée au palier',
      infeasible: 'QEC au-dessus de la plage',
    },
    recommended: 'Coût total le plus bas',
    noneFeasible: 'Aucun palier ne donne de quantité réalisable.',
  },

  penalty: {
    caption:
      'La courbe de coût est plate autour de son minimum. Commander à 20 % de Q* coûte environ 2 % de plus.',
    columns: {
      ratio: 'Q / Q*',
      quantity: 'Q',
      relevantCost: 'CTP',
      penalty: 'Surcoût',
    },
    optimum: 'Optimum',
  },

  sensitivity: {
    caption:
      'Q* varie comme la racine carrée de D et de S, et à l’inverse de la racine carrée de H : une erreur d’estimation est donc amortie.',
    columns: {
      parameter: 'Donnée',
      deviation: 'Erreur',
      value: 'Valeur',
      quantity: 'Q*',
      quantityChange: 'Variation de Q*',
      relevantCost: 'CTP',
      relevantCostChange: 'Variation du CTP',
    },
    parameters: {
      annualDemand: 'Demande annuelle',
      orderCost: 'Coût de passation',
      holdingCostPerUnit: 'Coût de possession',
    },
    baseline: 'Référence',
  },

  chart: {
    title: 'Coût annuel en fonction de la quantité commandée',
    xAxis: 'Quantité commandée',
    yAxis: 'Coût annuel',
    ordering: 'passation',
    holding: 'possession',
    total: 'total',
    optimum: 'Q*',
    readoutHint:
      'Déplacez le curseur sur le graphique, ou utilisez les flèches, pour lire le coût à une quantité donnée.',
    readoutQuantity: 'À Q',
    readoutCost: 'Coût',
    readoutPenalty: 'Écart à l’optimum',
    priceBreak: 'Palier de remise',
    includesPurchase:
      'Le total inclut le coût d’achat, la courbe chute donc à chaque palier.',
    tableCaption: 'Valeurs de la courbe de coût',
    tableQuantity: 'Quantité commandée',
    tableOrdering: 'Coût de passation',
    tableHolding: 'Coût de possession',
    tableTotal: 'Coût total',
  },

  errors: {
    required: 'Saisissez une valeur',
    'not-a-number':
      'Nombre non reconnu. Utilisez des chiffres, avec une virgule ou un point pour les décimales.',
    'must-be-positive': 'Doit être supérieur à 0',
    'must-be-non-negative': 'Doit être supérieur ou égal à 0',
    'rate-out-of-range': 'Doit être supérieur à 0 et au plus égal à 100',
    'service-level-out-of-range':
      'Doit être strictement compris entre 0 et 100. Un taux de service de 100 % exigerait un stock de sécurité infini.',
  },

  schedule: {
    'schedule-empty': 'Ajoutez au moins un palier, commençant à la quantité 1',
    'first-tier-must-start-at-one': 'Le premier palier doit commencer à la quantité 1',
    'min-qty-must-be-whole-and-positive': 'La quantité doit être un entier supérieur ou égal à 1',
    'min-qty-must-ascend': 'Chaque palier doit commencer au-dessus du précédent',
    'unit-cost-must-be-positive': 'Le coût unitaire doit être supérieur à 0',
  },

  empty: {
    headline: 'Rien à calculer pour l’instant',
    needs: 'Encore nécessaire :',
    reorderNeeds:
      'Le point de commande demande une demande moyenne, un délai et un taux de service.',
    discountNeeds: 'La comparaison demande un barème de remises valide.',
  },

  print: {
    generated: 'Établi le',
    assumptions: 'Hypothèses de saisie',
    model: 'Remises à tarif uniforme. Taux de service par cycle, et non taux de satisfaction.',
  },

  csv: {
    section: 'Section',
    inputs: 'Données saisies',
    results: 'Résultats',
    field: 'Champ',
    symbol: 'Symbole',
    value: 'Valeur',
    unit: 'Unité',
  },

  a11y: {
    skipToResults: 'Aller aux résultats',
    inputRail: 'Données saisies',
    resultsRegion: 'Résultats',
    chartRegion: 'Courbe de coût',
    removeTierAt: 'Supprimer le palier commençant à',
  },
};
