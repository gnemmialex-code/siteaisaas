/**
 * Pages d'atterrissage thématiques — SQUELETTES.
 *
 * Ce fichier ne contient que de la structure et des métadonnées : titres,
 * descriptions, plan de sections, questions de FAQ. Aucun texte de corps
 * n'est rédigé ici, et aucun ne doit l'être automatiquement : le contenu est
 * écrit ou validé à la main avant publication.
 *
 * Tant que `draft` vaut true, la page est en noindex et absente du sitemap.
 * Une page vide qui se fait indexer coûte plus qu'elle ne rapporte.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AUCUNE de ces pages ne cible un nom de marque horlogère déposée. C'est une
 * décision à prendre explicitement, pas un défaut technique : voir la note en
 * fin de fichier.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface LandingSection {
  /** Titre de section (h2), affiché tel quel. */
  heading: string;
  /** Ce que la section doit couvrir. Consigne de rédaction, jamais affichée. */
  brief: string;
}

export interface LandingPage {
  /** Segment d'URL, sous `base`. */
  slug: string;
  /** Racine de la rubrique : "/usages" ou "/comparatifs". */
  base: string;
  /** Libellé court, utilisé dans le fil d'Ariane et les liens internes. */
  label: string;
  /** <title> de la page. Viser 55–60 caractères. */
  title: string;
  /** <meta description>. Viser 150–160 caractères. */
  description: string;
  /** Unique h1 de la page. */
  h1: string;
  /** Phrase d'accroche sous le h1. */
  intro: string;
  sections: LandingSection[];
  /** Questions destinées au bloc FAQ. Les réponses restent à écrire. */
  faq: string[];
  draft: boolean;
}

export const LANDING_PAGES: LandingPage[] = [
  {
    slug: "photo-de-profil",
    base: "/usages",
    label: "Photo de profil",
    title: "Photo de profil au poignet : montre ajoutée par IA — AstraCrea",
    description:
      "Générez une photo de profil soignée avec une montre de luxe au poignet. Envoyez un cliché, l'IA compose le rendu en 4K. Ce qui marche, ce qui rate, et pourquoi.",
    h1: "Une photo de profil avec une montre de luxe au poignet",
    intro:
      "Ce que l'essayage virtuel change pour une photo de profil, et comment obtenir un rendu crédible du premier coup.",
    sections: [
      {
        heading: "Pourquoi la photo de profil est le cas d'usage le plus exigeant",
        brief:
          "Expliquer que le visage et le poignet sont regardés de près, que le moindre défaut de rendu se voit, et ce que ça implique sur le choix du cliché de départ.",
      },
      {
        heading: "Le cliché de départ : ce qui donne un bon résultat",
        brief:
          "Cadrage, lumière, angle du poignet, netteté. Reprendre les critères déjà énoncés dans la FAQ de la page d'accueil pour rester cohérent.",
      },
      {
        heading: "Les erreurs qui gâchent le rendu",
        brief:
          "Contre-jour, poignet coupé, flou de bougé, manche qui recouvre la zone. Illustrer avec des exemples avant/après existants plutôt que d'en produire de nouveaux.",
      },
      {
        heading: "De la génération à la publication",
        brief:
          "Résolution disponible selon la formule, format à privilégier selon le réseau, et rappel du cadre d'usage personnel.",
      },
    ],
    faq: [
      "Quelle résolution choisir pour une photo de profil ?",
      "Faut-il que le poignet soit visible en entier ?",
      "Puis-je utiliser le résultat sur un profil professionnel ?",
    ],
    draft: true,
  },
  {
    slug: "style-editorial",
    base: "/usages",
    label: "Style éditorial",
    title: "Rendu éditorial : photo de montre façon magazine — AstraCrea",
    description:
      "Obtenez un rendu de montre au poignet dans une esthétique de magazine : lumière travaillée, matières marquées, cadrage serré. Ce que l'IA sait faire, et ses limites.",
    h1: "Un rendu éditorial, façon photo de magazine",
    intro:
      "Ce qui distingue une image éditoriale d'un simple cliché, et comment l'obtenir sans studio.",
    sections: [
      {
        heading: "Ce qu'on appelle un rendu éditorial",
        brief:
          "Définir concrètement : traitement de la lumière, contraste, rendu des matières, profondeur de champ. Éviter le jargon marketing.",
      },
      {
        heading: "Ce que l'IA restitue bien, et ce qu'elle rate encore",
        brief:
          "Être honnête sur les limites : reflets sur le verre, maillons du bracelet, texte du cadran. C'est ce qui rend la page citable plutôt que promotionnelle.",
      },
      {
        heading: "Préparer son cliché pour un rendu éditorial",
        brief:
          "Fond neutre, lumière latérale, poignet stable. Différencier des consignes de la page photo de profil pour éviter le contenu dupliqué.",
      },
      {
        heading: "Qualité de sortie et upscale",
        brief:
          "Expliquer le passage par RealESRGAN et ce que l'upscale x4 change réellement à l'impression de netteté.",
      },
    ],
    faq: [
      "Quelle différence entre un rendu HD et un rendu 4K ?",
      "Le rendu éditorial demande-t-il une formule particulière ?",
      "Peut-on choisir l'ambiance lumineuse du rendu ?",
    ],
    draft: true,
  },
  {
    slug: "avant-apres",
    base: "/usages",
    label: "Avant / après",
    title: "Avant / après : ce que l'IA change sur la photo — AstraCrea",
    description:
      "Comparez côte à côte le cliché d'origine et le rendu généré. Ce que l'IA modifie exactement, ce qu'elle laisse intact, et comment juger un résultat.",
    h1: "Avant / après : ce que l'IA modifie réellement",
    intro:
      "Une lecture détaillée des comparaisons avant/après, pour savoir ce qui est ajouté et ce qui ne l'est pas.",
    sections: [
      {
        heading: "Ce que la génération modifie, zone par zone",
        brief:
          "Poignet, ombres portées, reflets sur la peau, arrière-plan. Dire clairement ce qui reste inchangé : le visage, le décor, la posture.",
      },
      {
        heading: "Lire une comparaison sans se faire avoir",
        brief:
          "Donner des critères de jugement : cohérence de l'ombre, alignement du bracelet, raccord avec la manche. Utile et citable.",
      },
      {
        heading: "Les cas où le résultat n'est pas exploitable",
        brief:
          "Assumer les échecs. Une page qui ne montre que des réussites n'est crédible ni pour un lecteur ni pour un moteur de réponse.",
      },
      {
        heading: "Que deviennent les deux images",
        brief:
          "Reprendre la règle déjà énoncée : la photo d'origine est supprimée après traitement, seule la génération est conservée dans l'historique.",
      },
    ],
    faq: [
      "La photo d'origine est-elle conservée ?",
      "Peut-on récupérer les deux versions de l'image ?",
      "Pourquoi certains rendus sont-ils moins nets que d'autres ?",
    ],
    draft: true,
  },
  {
    slug: "outils-photo-ia",
    base: "/comparatifs",
    label: "Comparatif d'outils",
    title: "Outils d'essayage virtuel par IA : comment les comparer — AstraCrea",
    description:
      "Les critères qui séparent réellement deux outils de génération photo par IA : qualité de rendu, vitesse, résolution, traitement des données et conditions d'usage.",
    h1: "Comparer les outils d'essayage virtuel par IA",
    intro:
      "Les critères qui comptent au moment de choisir, et la façon de les vérifier soi-même.",
    sections: [
      {
        heading: "Les critères qui font vraiment la différence",
        brief:
          "Résolution de sortie réelle (pas annoncée), temps de génération, cohérence des ombres, gestion des refus. Poser une grille de lecture neutre.",
      },
      {
        heading: "Ce que recouvre vraiment une annonce « 4K »",
        brief:
          "Distinguer résolution native et upscale. Sujet technique, vérifiable, et typiquement le genre de passage qu'un moteur de réponse cite.",
      },
      {
        heading: "Traitement des données et des photos envoyées",
        brief:
          "Durée de conservation, sous-traitants, base légale. Renvoyer vers /privacy et /consent plutôt que de reformuler.",
      },
      {
        heading: "Conditions d'usage et licence des images produites",
        brief:
          "Usage personnel contre usage commercial. Renvoyer vers /terms.",
      },
      {
        heading: "Se faire son propre avis",
        brief:
          "Proposer un protocole de test reproductible avec un même cliché de départ. C'est ce qui rend la page utile plutôt que publicitaire.",
      },
    ],
    faq: [
      "Comment vérifier la résolution réelle d'un rendu ?",
      "Que regarder en priorité dans les conditions d'utilisation ?",
      "Un abonnement est-il nécessaire pour tester ?",
    ],
    draft: true,
  },
];

export function landingPath(page: LandingPage): string {
  return `${page.base}/${page.slug}`;
}

export function getLandingPages(base: string): LandingPage[] {
  return LANDING_PAGES.filter((p) => p.base === base);
}

export function getLandingPage(base: string, slug: string): LandingPage | undefined {
  return LANDING_PAGES.find((p) => p.base === base && p.slug === slug);
}

/** Pages effectivement publiées : les seules à entrer dans le sitemap. */
export function getPublishedLandingPages(): LandingPage[] {
  return LANDING_PAGES.filter((p) => !p.draft);
}

/**
 * NOTE SUR LES MARQUES DÉPOSÉES — à arbitrer avant toute création de page.
 *
 * Les requêtes à plus fort volume du secteur associent un nom de marque à
 * l'intention (« Rolex au poignet », « porter une Hublot »…). Aucune page de
 * ce type n'est créée ici : cibler une marque déposée dans une URL, un title
 * ou un h1 engage un risque juridique qui n'est pas technique et qui ne se
 * délègue pas. Le site nomme déjà ces marques en légende de ses exemples,
 * ce qui est un usage descriptif ; une page entière construite autour d'un
 * nom de marque relève d'une autre logique.
 */
