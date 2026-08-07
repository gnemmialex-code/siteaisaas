/**
 * Constructeurs de données structurées schema.org.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AUCUN Review, AggregateRating ni ratingValue n'est produit ici, et il ne
 * doit pas en être ajouté tant que les avis ne proviennent pas d'utilisateurs
 * réels et vérifiables. Les avis affichés sur la page d'accueil ainsi que le
 * « 4,9 / 5 — 2 300+ avis » sont des valeurs écrites en dur dans le code :
 * les baliser constituerait un balisage trompeur au sens des règles anti-spam
 * de Google et exposerait le domaine à une action manuelle.
 * ─────────────────────────────────────────────────────────────────────────
 */

import type { FaqItem } from "@/lib/faq";
import { PLAN_OFFERS, PRICE_CURRENCY } from "@/lib/plans";
import { HOME_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

/** Adresse de support affichée sur /contact et dans la FAQ de la home. */
const SUPPORT_EMAIL = "contact@riseandclose.co";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

const abs = (path: string) => new URL(path, SITE_URL).toString();

/**
 * Éditeur du site.
 *
 * `sameAs` est volontairement absent : aucun profil social vérifiable n'est
 * référencé dans le code du site. Déclarer des profils inexistants ou non
 * contrôlés serait une fausse déclaration d'identité.
 */
export function organizationSchema(): Record<string, unknown> {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: abs("/logo2.png"),
      width: 2000,
      height: 2000,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SUPPORT_EMAIL,
        availableLanguage: ["fr"],
      },
    ],
  };
}

/**
 * Le site lui-même.
 *
 * Pas de `potentialAction` / SearchAction : le site n'a pas de moteur de
 * recherche interne, en déclarer un pointerait vers une URL inexistante.
 */
export function websiteSchema(): Record<string, unknown> {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: HOME_DESCRIPTION,
    inLanguage: "fr-FR",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/**
 * L'application elle-même, avec ses formules.
 *
 * Les prix proviennent de lib/plans.ts, qui alimente aussi l'affichage de
 * /pricing : le balisage ne peut pas diverger du prix affiché.
 */
export function softwareApplicationSchema(): Record<string, unknown> {
  const prices = PLAN_OFFERS.map((p) => p.price);

  return {
    // WebApplication plutôt que SoftwareApplication : c'est une sous-classe,
    // donc l'ensemble reste éligible aux mêmes traitements, et c'est le seul
    // des deux types sur lequel `browserRequirements` est défini
    // (validator.schema.org le refuse sur SoftwareApplication).
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#application`,
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    browserRequirements: "Navigateur moderne avec JavaScript activé",
    inLanguage: "fr-FR",
    description: HOME_DESCRIPTION,
    publisher: { "@id": ORGANIZATION_ID },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: PRICE_CURRENCY,
      lowPrice: Math.min(...prices).toFixed(2),
      highPrice: Math.max(...prices).toFixed(2),
      offerCount: PLAN_OFFERS.length,
      offers: PLAN_OFFERS.map((plan) => ({
        "@type": "Offer",
        name: plan.name,
        description: plan.description,
        price: plan.price.toFixed(2),
        priceCurrency: PRICE_CURRENCY,
        url: abs("/pricing"),
        availability: "https://schema.org/InStock",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: plan.price.toFixed(2),
          priceCurrency: PRICE_CURRENCY,
          // Abonnement mensuel : 1 mois (P1M au format ISO 8601).
          billingDuration: 1,
          billingIncrement: 1,
          unitCode: "MON",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: 1,
            unitCode: "MON",
          },
        },
      })),
    },
  };
}

/**
 * FAQ. `items` doit venir de lib/faq.ts, qui alimente aussi l'affichage :
 * le balisage est ainsi strictement identique au texte visible.
 */
export function faqPageSchema(items: FaqItem[], path: string): Record<string, unknown> {
  return {
    "@type": "FAQPage",
    "@id": `${abs(path)}#faq`,
    inLanguage: "fr-FR",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

/**
 * Fil d'Ariane des pages internes. `Accueil` est toujours le premier maillon.
 * Il n'y a pas de fil d'Ariane visible sur le site : ce balisage décrit la
 * position réelle de la page dans l'arborescence, ce que Google accepte.
 */
export function breadcrumbSchema(page: { name: string; path: string }): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    "@id": `${abs(page.path)}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page.name,
        item: abs(page.path),
      },
    ],
  };
}
