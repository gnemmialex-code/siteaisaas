"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-surface-border">{title}</h2>
      <div className="text-white/70 text-sm leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function ConsentPage() {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-accent-violet/10 border border-accent-violet/30 text-accent-violet text-sm font-medium px-4 py-2 rounded-full mb-6">
            <ShieldCheck className="w-4 h-4" />
            Traitement de données sensibles
          </div>
          <h1 className="text-4xl font-black text-white mb-3">
            Politique de Consentement
          </h1>
          <p className="text-white/40 text-sm">
            Dernière mise à jour : 25 mai 2025 — Version 1.0
          </p>
        </div>

        {/* Alerte données biométriques */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5 mb-10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-white/70">
              <p className="font-semibold text-white mb-1">Information importante sur les données biométriques</p>
              <p>
                Le Service AstraCrea traite des photographies comportant un visage humain. En vertu du RGPD
                (article 9) et de la loi française Informatique et Libertés, ce traitement est soumis à votre
                consentement <span className="text-white font-semibold">explicite, libre, éclairé et spécifique</span>,
                que vous pouvez retirer à tout moment.
              </p>
            </div>
          </div>
        </div>

        <Section title="1. Nature des données traitées">
          <p>
            Lorsque vous téléversez une photographie sur AstraCrea, cette image est analysée par un algorithme de
            détection faciale (InsightFace) afin d&apos;identifier et d&apos;extraire les caractéristiques du visage
            représenté. Cette opération constitue un traitement de <span className="text-white font-semibold">données
            biométriques au sens de l&apos;article 9 du RGPD</span>.
          </p>
          <p>
            Les caractéristiques faciales extraites sont utilisées exclusivement pour la fusion de visage dans le
            style choisi (face swap), puis <span className="text-white font-semibold">supprimées définitivement</span>{" "}
            à l&apos;issue du traitement. Aucune empreinte faciale n&apos;est conservée, indexée ou utilisée à
            d&apos;autres fins.
          </p>
        </Section>

        <Section title="2. Finalités du traitement soumises à consentement">
          <p>Votre consentement explicite est requis pour les traitements suivants :</p>
          <ul className="space-y-2 pl-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-accent-violet flex-shrink-0 mt-0.5" />
              <span>
                <span className="text-white font-medium">Analyse faciale</span> : détection et extraction des caractéristiques de votre visage pour permettre la transformation.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-accent-violet flex-shrink-0 mt-0.5" />
              <span>
                <span className="text-white font-medium">Génération d&apos;image</span> : utilisation des caractéristiques extraites pour produire l&apos;image transformée dans le style sélectionné.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-accent-violet flex-shrink-0 mt-0.5" />
              <span>
                <span className="text-white font-medium">Stockage temporaire</span> : conservation de la photo originale sur nos serveurs de traitement sécurisés pendant la durée strictement nécessaire à la génération (quelques secondes à quelques dizaines de secondes).
              </span>
            </li>
          </ul>
        </Section>

        <Section title="3. Conditions du consentement">
          <p>
            Votre consentement au traitement de vos données biométriques est :
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><span className="text-white font-medium">Libre</span> : vous n&apos;êtes pas contraint d&apos;utiliser le Service. Le refus du consentement signifie simplement que vous ne pourrez pas utiliser la fonctionnalité de génération d&apos;image.</li>
            <li><span className="text-white font-medium">Éclairé</span> : la présente page vous informe clairement de la nature, des finalités et des modalités du traitement avant toute action.</li>
            <li><span className="text-white font-medium">Spécifique</span> : le consentement est sollicité uniquement pour les finalités décrites ci-dessus, et non pour d&apos;autres usages.</li>
            <li><span className="text-white font-medium">Non équivoque</span> : il est recueilli par une action positive et affirmative (téléversement volontaire de votre photo, après acceptation des CGU et de la présente politique).</li>
          </ul>
          <p>
            En téléversant une photo sur le Service, vous confirmez que vous êtes la personne représentée sur la
            photo, <span className="text-white font-semibold">ou</span> que vous avez obtenu le consentement explicite
            écrit de la personne photographiée pour ce traitement.
          </p>
        </Section>

        <Section title="4. Retrait du consentement">
          <p>
            Vous pouvez retirer votre consentement à tout moment, sans que cela affecte la licéité des traitements
            réalisés avant ce retrait (article 7, paragraphe 3 du RGPD).
          </p>
          <p>
            Le retrait du consentement s&apos;effectue par :
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Suppression d&apos;une image générée depuis votre tableau de bord (effet immédiat).</li>
            <li>Demande de suppression de l&apos;ensemble de vos données par e-mail à{" "}
              <a href="mailto:contact@riseandclose.co" className="text-accent-violet hover:underline">contact@riseandclose.co</a>
              {" "}(traitement sous 30 jours).
            </li>
            <li>Suppression de votre compte depuis les paramètres (entraîne la suppression de toutes vos données générées).</li>
          </ul>
          <p>
            Le retrait du consentement ne donne pas droit au remboursement de la période d&apos;abonnement en cours.
          </p>
        </Section>

        <Section title="5. Garanties relatives aux personnes représentées">
          <p>
            Vous vous engagez formellement à :
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              Ne téléverser que des photos sur lesquelles vous apparaissez personnellement, ou pour lesquelles vous
              détenez un consentement écrit de la personne concernée.
            </li>
            <li>
              Ne pas utiliser le Service pour générer des images de personnes sans leur accord, notamment des
              personnalités publiques, à des fins de diffusion, de tromperie ou de nuisance.
            </li>
            <li>
              Ne pas générer ni diffuser de contenu à caractère sexuel impliquant des images de personnes réelles
              sans leur consentement explicite et démontrable.
            </li>
          </ul>
          <p>
            Tout manquement à ces engagements constitue une violation des présentes conditions et des{" "}
            <Link href="/terms" className="text-accent-violet hover:underline">CGU</Link>, et peut entraîner la
            suspension de votre compte ainsi que des poursuites judiciaires.
          </p>
        </Section>

        <Section title="6. Utilisation de photos de mineurs">
          <p>
            Le traitement de photos représentant des mineurs est strictement interdit sur le Service, y compris
            pour les parents ou tuteurs légaux. Le Service est exclusivement réservé aux personnes majeures (18 ans
            et plus) photographiant leur propre visage ou disposant du consentement d&apos;une personne majeure.
          </p>
        </Section>

        <Section title="7. Base légale et conformité réglementaire">
          <p>
            Le traitement de données biométriques repose sur votre consentement explicite au sens de l&apos;article
            9, paragraphe 2, point a) du RGPD. Ce traitement a fait l&apos;objet d&apos;une analyse d&apos;impact
            relative à la protection des données (AIPD) conformément à l&apos;article 35 du RGPD, compte tenu de la
            nature sensible des données traitées.
          </p>
          <p>
            Le Service est conçu selon le principe du <span className="text-white font-medium">Privacy by Design</span> :
            seules les données strictement nécessaires à la fourniture du Service sont collectées, et la photo
            originale est détruite immédiatement après traitement.
          </p>
        </Section>

        <Section title="8. Sous-traitants impliqués dans le traitement biométrique">
          <p>
            Le traitement de votre image est réalisé sur nos serveurs dédiés. Aucune donnée biométriques
            n&apos;est transmise à des services tiers à des fins d&apos;analyse, de reconnaissance ou de
            profilage. Les modèles d&apos;IA utilisés (InsightFace, SDXL, ReActor, RealESRGAN) fonctionnent en
            local sur notre infrastructure.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>
            Pour toute question relative au traitement de vos données biométriques ou pour exercer vos droits :{" "}
            <a href="mailto:contact@riseandclose.co" className="text-accent-violet hover:underline">
              contact@riseandclose.co
            </a>
          </p>
          <p>
            Vous pouvez également introduire une réclamation auprès de la{" "}
            <span className="text-white font-medium">CNIL</span> (Commission Nationale de l&apos;Informatique et
            des Libertés) sur www.cnil.fr.
          </p>
        </Section>

        {/* Bloc d'accusé de lecture */}
        <div className={`border rounded-2xl p-6 transition-all duration-300 ${
          acknowledged
            ? "border-green-500/40 bg-green-500/5"
            : "border-surface-border bg-surface/50"
        }`}>
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  acknowledged
                    ? "bg-green-500 border-green-500"
                    : "border-surface-border hover:border-accent-violet/50"
                }`}
              >
                {acknowledged && <span className="text-white text-sm font-bold">✓</span>}
              </div>
            </div>
            <div>
              <p className="text-white font-semibold mb-1">
                J&apos;ai lu et compris la politique de consentement
              </p>
              <p className="text-white/50 text-sm leading-relaxed">
                Je comprends que le Service traite les caractéristiques faciales de mes photos à des fins de
                transformation par IA, que ces données sont supprimées immédiatement après traitement, et que
                je peux retirer mon consentement à tout moment.
              </p>
            </div>
          </label>
          {acknowledged && (
            <div className="mt-4 flex items-center gap-2 text-green-400 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Merci d&apos;avoir pris connaissance de cette politique.
            </div>
          )}
        </div>

        <div className="border-t border-surface-border pt-8 mt-8 flex flex-col sm:flex-row gap-4 text-sm text-white/40">
          <Link href="/terms" className="hover:text-white/70 transition-colors">CGU</Link>
          <Link href="/privacy" className="hover:text-white/70 transition-colors">Confidentialité</Link>
          <Link href="/" className="hover:text-white/70 transition-colors">Retour à l&apos;accueil</Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
