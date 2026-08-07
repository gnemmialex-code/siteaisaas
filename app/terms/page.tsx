import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/terms",
  title: "Conditions Générales d'Utilisation — AstraCrea",
  description:
    "Conditions Générales d'Utilisation du service AstraCrea : accès au service, abonnements, propriété des créations et responsabilités.",
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-surface-border">{title}</h2>
      <div className="text-white/70 text-sm leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-accent-violet/10 border border-accent-violet/30 text-accent-violet text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            Document légal
          </div>
          <h1 className="text-4xl font-black text-white mb-3">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="text-white/40 text-sm">
            Dernière mise à jour : 07/08/2026 — Version 4.8
          </p>
        </div>

        <Section title="1. Présentation du service">
          <p>
            AstraCrea (ci-après « le Service ») est une plateforme de transformation d&apos;images par intelligence
            artificielle, éditée et exploitée par Rise and Close (ci-après « l&apos;Éditeur »), joignable à
            l&apos;adresse e-mail : <a href="mailto:contact@riseandclose.co" className="text-accent-violet hover:underline">contact@riseandclose.co</a>.
          </p>
          <p>
            Le Service permet aux utilisateurs enregistrés de téléverser une photographie personnelle et d&apos;obtenir
            une image transformée grâce à des modèles d&apos;IA (détection de visage, génération de style, fusion de
            visage, upscale 4K). Sans abonnement, l&apos;utilisateur obtient un aperçu flouté de sa transformation.
            Le rendu net en haute définition, ainsi que la génération vidéo, sont réservés aux abonnements payants
            actifs, qui incluent des générations illimitées.
          </p>
        </Section>

        <Section title="2. Acceptation des CGU">
          <p>
            L&apos;accès au Service implique l&apos;acceptation pleine et entière des présentes Conditions Générales
            d&apos;Utilisation (CGU). Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le Service.
          </p>
          <p>
            En cochant la case « J&apos;accepte les CGU » lors de votre inscription, ou en utilisant le Service après
            votre connexion via OAuth, vous reconnaissez avoir lu, compris et accepté les présentes CGU.
          </p>
          <p>
            L&apos;Éditeur se réserve le droit de modifier les CGU à tout moment. Les modifications entrent en vigueur
            dès leur publication sur le Site. Il vous appartient de les consulter régulièrement.
          </p>
        </Section>

        <Section title="3. Création de compte et accès">
          <p>
            Pour accéder au Service, vous devez créer un compte en fournissant une adresse e-mail valide et un mot de
            passe, ou en vous connectant via un fournisseur OAuth tiers (Google, Apple).
          </p>
          <p>
            Vous êtes responsable de la confidentialité de vos identifiants. Tout accès au Service effectué avec vos
            identifiants est réputé être effectué par vous. En cas d&apos;utilisation non autorisée, vous devez en
            informer immédiatement l&apos;Éditeur.
          </p>
          <p>
            Le Service est réservé aux personnes physiques majeures (18 ans ou plus) ou aux personnes morales
            régulièrement constituées. L&apos;accès est interdit aux mineurs.
          </p>
          <p>
            La création d&apos;un compte est gratuite et sans carte bancaire. Un compte gratuit permet de générer des
            aperçus flous de vos transformations. L&apos;accès au rendu net en haute définition nécessite un abonnement
            payant actif.
          </p>
        </Section>

        <Section title="4. Abonnements et paiement">
          <p>
            L&apos;accès au rendu net en haute définition est réservé aux abonnements payants. Chaque formule
            (Essentiel, Pro, Elite) inclut des générations illimitées, les différences portant sur la qualité, la
            vitesse et les fonctionnalités disponibles (la génération vidéo étant réservée aux plans Pro et Elite).
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Compte gratuit : aperçu flouté, sans engagement ni carte bancaire.</li>
            <li>Abonnements mensuels ou annuels (Essentiel, Pro, Elite) : rendu net illimité.</li>
            <li>Toute autre offre promotionnelle communiquée par l&apos;Éditeur.</li>
          </ul>
          <p>
            Les prix sont affichés en euros TTC sur la page Tarifs. L&apos;Éditeur se réserve le droit de modifier ses
            tarifs à tout moment, sans effet rétroactif sur les périodes d&apos;abonnement déjà réglées.
          </p>
          <p>
            L&apos;abonnement est reconductible et peut être résilié à tout moment ; l&apos;accès reste actif jusqu&apos;à
            la fin de la période en cours.
          </p>
          <p>
            Les paiements sont traités de manière sécurisée par Stripe, Inc. L&apos;Éditeur ne stocke pas vos
            informations bancaires. En cas d&apos;insatisfaction sur vos 3 premières générations, un remboursement
            intégral peut être demandé sous 48 heures en contactant l&apos;Éditeur.
          </p>
        </Section>

        <Section title="5. Utilisation acceptable">
          <p>
            Vous vous engagez à utiliser le Service uniquement à des fins créatives personnelles et licites. Il est
            strictement interdit de :
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              Téléverser des photos de personnes sans leur consentement explicite préalable, sauf si vous êtes
              vous-même la personne représentée.
            </li>
            <li>Générer du contenu à caractère pornographique, violent, haineux, discriminatoire ou illicite.</li>
            <li>Utiliser le Service pour créer du contenu destiné à tromper, diffamer ou nuire à autrui.</li>
            <li>
              Utiliser les images générées à des fins commerciales (publicité, revente, monétisation) sans licence
              spécifique accordée par l&apos;Éditeur.
            </li>
            <li>
              Tenter de contourner les mesures de sécurité, d&apos;accéder à des données non autorisées ou de
              perturber le fonctionnement du Service.
            </li>
            <li>Utiliser des robots, scripts ou tout moyen automatisé pour accéder au Service sans autorisation.</li>
            <li>Usurper l&apos;identité d&apos;une personne réelle, notamment d&apos;une personnalité publique, dans un but malveillant.</li>
          </ul>
          <p>
            Tout manquement à ces règles peut entraîner la suspension ou la suppression définitive de votre compte,
            sans remboursement de l&apos;abonnement en cours, ainsi que des poursuites judiciaires si nécessaire.
          </p>
        </Section>

        <Section title="6. Contenu généré par IA et droits à l'image">
          <p>
            Les images générées par le Service sont produites par des modèles d&apos;IA à partir de votre photo. Vous
            demeurez l&apos;unique responsable du contenu que vous téléversez et des usages que vous faites des
            images générées.
          </p>
          <p>
            En téléversant une photo, vous déclarez et garantissez que :
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Vous êtes la personne représentée sur la photo, ou vous disposez du consentement écrit de cette personne.</li>
            <li>La photo ne porte pas atteinte aux droits de tiers (droits d&apos;auteur, droit à l&apos;image, vie privée).</li>
            <li>Vous n&apos;utiliserez pas les images générées à des fins interdites par les présentes CGU ou par la loi.</li>
          </ul>
          <p>
            L&apos;Éditeur ne peut être tenu responsable d&apos;un usage illicite des images générées par un
            utilisateur. En cas de signalement d&apos;abus, l&apos;Éditeur se réserve le droit de supprimer le contenu
            et de suspendre le compte concerné.
          </p>
        </Section>

        <Section title="7. Propriété intellectuelle">
          <p>
            Le Service, son interface, ses algorithmes, ses modèles d&apos;IA, ses marques, ses logos et l&apos;ensemble
            des contenus éditoriaux sont la propriété exclusive de l&apos;Éditeur ou de ses partenaires. Toute
            reproduction, distribution ou exploitation non autorisée est interdite.
          </p>
          <p>
            Les images générées par le Service sont mises à disposition de l&apos;utilisateur pour un usage créatif
            personnel. L&apos;utilisateur dispose d&apos;une licence limitée, non exclusive, non transférable, pour
            utiliser les images générées à des fins personnelles non commerciales.
          </p>
        </Section>

        <Section title="8. Données personnelles">
          <p>
            Le traitement de vos données personnelles est encadré par notre{" "}
            <Link href="/privacy" className="text-accent-violet hover:underline">
              Politique de Confidentialité
            </Link>{" "}
            et notre page{" "}
            <Link href="/consent" className="text-accent-violet hover:underline">
              Consentement
            </Link>
            , disponibles sur le Site. Ces documents font partie intégrante des présentes CGU.
          </p>
        </Section>

        <Section title="9. Disponibilité et limitation de responsabilité">
          <p>
            L&apos;Éditeur s&apos;efforce d&apos;assurer la disponibilité du Service 24h/24, 7j/7, mais ne peut
            garantir une disponibilité sans interruption. Des maintenances ou des incidents techniques peuvent survenir.
          </p>
          <p>
            Dans les limites autorisées par la loi, l&apos;Éditeur ne peut être tenu responsable de dommages indirects,
            de perte de données, de manque à gagner, ou de préjudice résultant de l&apos;utilisation ou de
            l&apos;impossibilité d&apos;utiliser le Service.
          </p>
          <p>
            La responsabilité de l&apos;Éditeur au titre de dommages directs ne peut excéder le montant total payé par
            l&apos;utilisateur au cours des 12 derniers mois.
          </p>
        </Section>

        <Section title="10. Résiliation">
          <p>
            Vous pouvez résilier votre abonnement ou supprimer votre compte à tout moment depuis votre tableau de bord
            ou en contactant l&apos;Éditeur. La suppression du compte met fin à l&apos;accès au Service, sans
            remboursement de la période d&apos;abonnement en cours.
          </p>
          <p>
            L&apos;Éditeur peut suspendre ou résilier votre accès en cas de violation des présentes CGU, sans préavis
            et sans remboursement de l&apos;abonnement en cours.
          </p>
        </Section>

        <Section title="11. Droit applicable et juridiction">
          <p>
            Les présentes CGU sont régies par le droit français. En cas de litige, et à défaut de résolution amiable,
            les tribunaux compétents du ressort du siège social de l&apos;Éditeur seront seuls compétents.
          </p>
          <p>
            Conformément aux articles L. 612-1 et suivants du Code de la consommation, tout utilisateur consommateur
            peut recourir gratuitement au service de médiation de la consommation en cas de litige non résolu.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Pour toute question relative aux présentes CGU, vous pouvez contacter l&apos;Éditeur à l&apos;adresse :{" "}
            <a href="mailto:contact@riseandclose.co" className="text-accent-violet hover:underline">
              contact@riseandclose.co
            </a>
          </p>
        </Section>

        <div className="border-t border-surface-border pt-8 mt-8 flex flex-col sm:flex-row gap-4 text-sm text-white/40">
          <Link href="/privacy" className="hover:text-white/70 transition-colors">Politique de Confidentialité</Link>
          <Link href="/consent" className="hover:text-white/70 transition-colors">Consentement</Link>
          <Link href="/" className="hover:text-white/70 transition-colors">Retour à l&apos;accueil</Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
