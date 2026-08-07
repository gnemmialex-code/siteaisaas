/**
 * Tarifs des abonnements, source unique.
 *
 * app/pricing/page.tsx lit ces valeurs pour l'affichage, et lib/schema.ts les
 * lit pour les `offers` du JSON-LD. Un prix balisé qui ne correspond pas au
 * prix affiché est un motif d'action manuelle chez Google : les deux doivent
 * venir du même endroit.
 *
 * Seul le tarif mensuel est balisé, parce que c'est celui affiché par défaut
 * sur /pricing. Le tarif annuel des plans qui n'ont pas de `yearly` explicite
 * est calculé à l'affichage (−17 %) et n'est donc pas une valeur de référence.
 */

export const PLAN_PRICES = {
  plan_essentiel: { monthly: 4.98, yearly: 49.8 },
  plan_pro: { monthly: 19.9 },
  plan_ultra: { monthly: 39.9 },
} as const;

export const PRICE_CURRENCY = "EUR";

/** Description des formules pour le JSON-LD, dans l'ordre d'affichage. */
export const PLAN_OFFERS = [
  {
    id: "plan_essentiel",
    name: "Essentiel",
    description: "Génération photo en HD 1080p, sans watermark, file d'attente partagée.",
    price: PLAN_PRICES.plan_essentiel.monthly,
  },
  {
    id: "plan_pro",
    name: "Pro",
    description: "Photo et vidéo jusqu'à 5 secondes, qualité Ultra 4K, file d'attente accélérée.",
    price: PLAN_PRICES.plan_pro.monthly,
  },
  {
    id: "plan_ultra",
    name: "Elite",
    description: "Photo et vidéo 4K jusqu'à 30 secondes, qualité 8K, priorité absolue et licence commerciale.",
    price: PLAN_PRICES.plan_ultra.monthly,
  },
] as const;
