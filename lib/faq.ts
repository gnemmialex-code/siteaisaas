/**
 * Contenu des FAQ, extrait des pages pour être partagé entre le rendu visible
 * et le JSON-LD.
 *
 * C'est volontairement la SEULE source : le balisage FAQPage doit être
 * strictement identique au texte affiché. Dupliquer ces textes ferait
 * diverger les deux au premier changement de formulation, ce que Google
 * traite comme du balisage trompeur.
 */

export interface FaqItem {
  q: string;
  a: string;
}

/** FAQ affichée en bas de la page d'accueil. */
export const HOME_FAQ: FaqItem[] = [
  {
    q: "Mes photos sont-elles conservées ?",
    a: "Non. Votre photo originale est automatiquement supprimée de nos serveurs après traitement. Seule l'image générée est stockée dans votre historique, et vous pouvez la supprimer à tout moment.",
  },
  {
    q: "Puis-je utiliser n'importe quelle photo ?",
    a: "Oui, tant que le visage est bien visible, de face ou légèrement de profil, avec une bonne luminosité. Les photos floues, très sombres ou avec plusieurs visages donnent des résultats moins précis.",
  },
  {
    q: "Combien de générations puis-je faire ?",
    a: "Tous les abonnements incluent des générations illimitées. Sans abonnement, vous obtenez un aperçu flouté ; le rendu net en HD se débloque dès qu'un abonnement est actif.",
  },
  {
    q: "Quelle est la résolution finale des images ?",
    a: "Toutes les images sont générées puis upscalées x4 via RealESRGAN. La résolution finale atteint jusqu'à 4K (4096×4096 px) selon le style choisi.",
  },
];

/** FAQ affichée en bas de la page des tarifs. */
export const PRICING_FAQ: FaqItem[] = [
  {
    q: "Y a-t-il une limite de générations ?",
    a: "Non. Tous les abonnements incluent des générations illimitées. Vous transformez autant de photos que vous le souhaitez, dans les limites de votre formule (la vidéo IA est réservée aux plans Pro et Elite).",
  },
  {
    q: "Que se passe-t-il sans abonnement ?",
    a: "Vous pouvez tester gratuitement : vous obtenez un aperçu flouté de votre transformation. Un abonnement actif débloque le rendu net en haute définition, téléchargeable.",
  },
  {
    q: "Puis-je changer de plan à tout moment ?",
    a: "Oui, vous pouvez upgrader ou downgrader votre plan à n'importe quel moment. Le changement prend effet immédiatement.",
  },
  {
    q: "Combien de temps dure une génération ?",
    a: "En moyenne 20 à 40 secondes selon la complexité du style. Les plans Pro et Ultra bénéficient d'une file d'attente prioritaire.",
  },
  {
    q: "Puis-je utiliser les images commercialement ?",
    a: "Les images sont pour usage personnel et créatif uniquement. L'usage commercial nécessite une licence spéciale — contactez-nous.",
  },
  {
    q: "Comment fonctionne le remboursement ?",
    a: "Nous offrons un remboursement intégral sous 48h si vous n'êtes pas satisfait de vos premières générations.",
  },
];
