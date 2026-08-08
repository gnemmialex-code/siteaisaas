/**
 * Exemples « avant / après » de la page d'accueil.
 *
 * Cette liste vit ici, et non dans app/home-content.tsx, parce qu'elle alimente
 * désormais deux consommateurs qui ne doivent pas diverger :
 *   — l'affichage des comparateurs sur la home (composant client) ;
 *   — le sitemap images de app/sitemap.ts (module serveur), qui ne peut pas
 *     importer un fichier "use client" sans embarquer framer-motion & co.
 * Même principe que lib/faq.ts, qui alimente à la fois l'accordéon et le
 * balisage FAQPage.
 *
 * ─── NOMS DE FICHIERS ───────────────────────────────────────────────────────
 * Les fichiers s'appelaient A1…A6_avant/apres.png. Le nom d'un fichier image
 * est un des signaux que Google exploite pour comprendre le sujet d'une image
 * (« Use descriptive file names », Google Image SEO best practices), et « A1 »
 * n'en portait aucun. Ils décrivent maintenant leur contenu réel.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ⬇️ C'EST ICI QU'ON NOMME LES EXEMPLES : le champ `style` est le texte affiché
 * en bas de chaque carte sur le site.
 * `altBefore` / `altAfter` : texte alternatif de chaque moitié du comparateur.
 * Contrairement au fond du hero, ces images sont du vrai contenu de page —
 * chaque texte est donc descriptif et unique.
 */

export interface ExampleImage {
  /** Libellé affiché sous la carte. */
  style: string;
  before: string;
  after: string;
  altBefore: string;
  altAfter: string;
  /**
   * Cette liste n'est affichée QUE sur ordinateur (sm+), dans l'ordre du
   * tableau. Sur téléphone, seul MOBILE_EXAMPLE est affiché à côté de la
   * vidéo : les champs `mobile` / `mobileFirst` ne servent donc plus.
   */
  mobile: boolean;
  mobileFirst: boolean;
}

export const EXAMPLES_IMAGES: ExampleImage[] = [
  {
    style: "Hublot Big Bang",
    before: "/examples/essayage-virtuel-hublot-big-bang-avant.png",
    after:  "/examples/essayage-virtuel-hublot-big-bang-apres.png",
    altBefore: "Poignet nu photographié avant l'essayage virtuel de la Hublot Big Bang",
    altAfter:  "Hublot Big Bang ajoutée au poignet par l'IA AstraCrea, rendu photoréaliste 4K",
    mobile: false, mobileFirst: false,
  },
  {
    style: "Rolex Deepsea D-Blue",
    before: "/examples/essayage-virtuel-rolex-deepsea-d-blue-avant.png",
    after:  "/examples/essayage-virtuel-rolex-deepsea-d-blue-apres.png",
    altBefore: "Poignet nu photographié avant l'essayage virtuel de la Rolex Deepsea D-Blue",
    altAfter:  "Rolex Deepsea au cadran dégradé bleu et noir ajoutée au poignet par l'IA AstraCrea",
    mobile: true,  mobileFirst: false,
  },
  {
    style: "Hublot Classic Fusion",
    before: "/examples/essayage-virtuel-hublot-classic-fusion-avant.png",
    after:  "/examples/essayage-virtuel-hublot-classic-fusion-apres.png",
    altBefore: "Poignet nu photographié avant l'essayage virtuel de la Hublot Classic Fusion",
    altAfter:  "Hublot Classic Fusion au boîtier fin ajoutée au poignet par l'IA AstraCrea",
    mobile: false, mobileFirst: false,
  },
  {
    style: "Rolex Oyster Perpetual",
    before: "/examples/essayage-virtuel-rolex-oyster-perpetual-avant.png",
    after:  "/examples/essayage-virtuel-rolex-oyster-perpetual-apres.png",
    altBefore: "Poignet nu photographié avant l'essayage virtuel de la Rolex Oyster Perpetual",
    altAfter:  "Rolex Oyster Perpetual sur bracelet acier ajoutée au poignet par l'IA AstraCrea",
    mobile: false, mobileFirst: false,
  },
  {
    style: "Tudor Black Bay",
    before: "/examples/essayage-virtuel-tudor-black-bay-avant.png",
    after:  "/examples/essayage-virtuel-tudor-black-bay-apres.png",
    altBefore: "Poignet nu photographié avant l'essayage virtuel de la Tudor Black Bay",
    altAfter:  "Tudor Black Bay à lunette de plongée ajoutée au poignet par l'IA AstraCrea",
    mobile: false, mobileFirst: false,
  },
  {
    style: "Rolex Submariner Hulk",
    before: "/examples/essayage-virtuel-rolex-submariner-hulk-avant.png",
    after:  "/examples/essayage-virtuel-rolex-submariner-hulk-apres.png",
    altBefore: "Poignet nu photographié avant l'essayage virtuel de la Rolex Submariner Hulk",
    altAfter:  "Rolex Submariner Hulk au cadran et à la lunette verts ajoutée au poignet par l'IA AstraCrea",
    mobile: true,  mobileFirst: true,
  },
];

/** Exemple affiché sur téléphone (à côté de la vidéo) dans « Exemples de transformations ». */
export const MOBILE_EXAMPLE: ExampleImage =
  EXAMPLES_IMAGES.find((e) => e.style === "Rolex Submariner Hulk") ?? EXAMPLES_IMAGES[0];

/**
 * Toutes les images d'exemple, dans l'ordre d'affichage — pour le sitemap images.
 *
 * On liste les chemins sources (/examples/…) et non les URL /_next/image?… :
 * ce sont eux qui sont stables dans le temps, et Googlebot les explore
 * directement. Les deux moitiés de chaque comparateur sont incluses : « avant »
 * et « après » sont deux images distinctes, toutes deux réellement rendues.
 */
export const EXAMPLE_IMAGE_PATHS: string[] = EXAMPLES_IMAGES.flatMap((e) => [e.before, e.after]);
