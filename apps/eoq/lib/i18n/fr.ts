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
      'Quantité économique de commande, stock de sécurité et remises sur quantité, calculés dans le navigateur.',
  },

  app: {
    name: 'Calculateur de commande de stock',
    tool: 'Commande de stock',
    language: 'Langue',
    siblings: 'Outils',
    currency: 'Devise',
  },

  actions: {
    loadExample: 'Charger un exemple',
    clear: 'Vider les champs',
    addTier: 'Ajouter un palier',
    removeTier: 'Supprimer le palier',
  },

  sections: {
    demandAndCost: 'Demande et coûts',
    workingYear: 'Année de travail',
    casePack: 'Conditionnement',
    safetyStock: 'Stock de sécurité',
    breaks: 'Remises sur quantité',
    results: 'Résultats',
    chart: 'Courbe de coût',
    discounts: 'Comparaison des remises à tarif uniforme',
    penalty: 'Coût d’une quantité de commande erronée',
  },

  fields: {
    annualDemand: { symbol: 'D', label: 'Demande annuelle' },
    orderCost: { symbol: 'S', label: 'Coût de passation par commande' },
    holdingCostPerUnit: { symbol: 'H', label: 'Coût de possession unitaire' },
    holdingRate: { symbol: 'i', label: 'Taux de possession' },
    unitCost: { symbol: 'C', label: 'Coût d’achat unitaire' },
    daysPerYear: { symbol: '', label: 'Jours ouvrés par an' },
    roundingMultiple: { symbol: '', label: 'Commander par multiples de' },
    safetyStock: { symbol: 'SS', label: 'Stock de sécurité conservé' },
  },

  holdingMode: {
    legend: 'Coût de possession exprimé en',
    perUnit: 'Montant par unité',
    rate: 'Taux sur le coût unitaire',
    derived: 'H = i × C',
  },



  toggles: {
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
    practicalQuantity: 'Quantité arrondie',
    penalty: 'Coût de l’arrondi',
    balanced: 'À Q*, le coût de passation égale le coût de possession',
    notBalanced: 'Les deux coûts diffèrent, cette quantité n’est donc pas Q*',
    closedForm: 'CTP = √(2·D·S·H)',
    orderWhole: 'Commander en unités entières : arrondir à',
    beforeRounding: 'avant arrondi',
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
    withSchedule: 'Avec ce barème, commander',
    minQty: 'Quantité à partir de',
    at: 'à',
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


  profile: {
    title: 'Évolution du stock',
    caption:
      'Le stock diminue au rythme de la demande jusqu’au stock de sécurité, où la livraison le reconstitue. Ce plancher est la part payée toute l’année et jamais vendue.',
    cycle: 'Cycle',
    axisTime: 'Temps',
    axisLevel: 'Stock disponible',
    tableCaption: 'Niveau de stock à chaque événement',
    tableEvent: 'Événement',
    tableTime: 'Temps',
    tableLevel: 'Stock disponible',
    eventStart: 'Début de cycle, stock reconstitué',
    eventDelivery: 'Stock de sécurité atteint, réception',
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
    discountNeeds: 'La comparaison demande un barème de remises valide.',
  },



  a11y: {
    skipToResults: 'Aller aux résultats',
    inputRail: 'Données saisies',
    resultsRegion: 'Résultats',
    chartRegion: 'Courbe de coût',
    removeTierAt: 'Supprimer le palier commençant à',
  },
};
