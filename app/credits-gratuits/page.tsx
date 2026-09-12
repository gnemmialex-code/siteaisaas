"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Gift, ShieldCheck, Clock, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type Status = {
  reward: number;
  daily_max: number;
  configured: boolean;
  authenticated: boolean;
  remaining: number;
  used_24h?: number;
  resets_at?: string | null;
  error?: string;
};

const ERRORS: Record<string, string> = {
  config:        "L'offre n'est pas encore configurée. Revenez un peu plus tard.",
  migration:     "Offre momentanément indisponible (base de données).",
  session:       "Session expirée. Relancez l'opération depuis cette page.",
  missing_hash:  "Retour invalide : les étapes Linkvertise n'ont pas été validées.",
  invalid_hash:  "Validation refusée : les étapes n'ont pas été terminées correctement.",
  invalid_token: "Vérification indisponible côté Linkvertise. Réessayez plus tard.",
  not_configured:"L'offre n'est pas encore configurée. Revenez un peu plus tard.",
  network:       "Impossible de contacter Linkvertise. Réessayez dans un instant.",
  quota:         "Quota atteint pour aujourd'hui.",
  refused:       "Récompense refusée.",
};

function CreditsGratuitsContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  const ok        = params.get("ok") === "1";
  const credits   = params.get("credits");
  const errorKey  = params.get("error");
  const errorMsg  = params.get("message");

  useEffect(() => {
    fetch("/api/linkvertise/status")
      .then((r) => r.json())
      .then((d: Status) => setStatus(d))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, [ok]);

  const reward    = status?.reward ?? 100;
  const dailyMax  = status?.daily_max ?? 3;
  const remaining = status?.remaining ?? dailyMax;
  const blocked   = !!status && status.authenticated && remaining <= 0;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-hover border border-surface-border text-xs font-semibold text-white/60 mb-5">
            <Gift className="w-3.5 h-3.5" />
            100 % gratuit
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            {reward} crédits <span className="gradient-text">offerts</span>
          </h1>
          <p className="text-white/55 text-lg leading-relaxed mb-8">
            Passez par notre partenaire Linkvertise, suivez les quelques étapes,
            puis revenez ici : les {reward} crédits sont ajoutés automatiquement
            à votre compte. Aucun paiement, aucune carte bancaire.
          </p>

          {/* Résultat du retour Linkvertise */}
          {ok && (
            <div className="card mb-6 border-emerald-500/30 bg-emerald-500/10 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">+{credits ?? reward} crédits ajoutés à votre compte</p>
                <Link href="/upload" className="text-sm text-emerald-300 hover:underline inline-flex items-center gap-1 mt-1">
                  Lancer une génération <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {errorKey && (
            <div className="card mb-6 border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-white/80 text-sm">
                {errorMsg || ERRORS[errorKey] || "Une erreur est survenue."}
              </p>
            </div>
          )}

          {/* Étapes */}
          <div className="card mb-6">
            <ol className="space-y-4">
              {[
                "Cliquez sur le bouton ci-dessous, vous partez sur Linkvertise.",
                "Suivez les étapes affichées jusqu'à la page de destination.",
                `Vous revenez automatiquement ici avec ${reward} crédits de plus.`,
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-gradient-violet-neon text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-white/70 text-sm leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Action */}
          {loading ? (
            <div className="h-12 rounded-xl bg-surface-hover animate-pulse" />
          ) : !status?.configured ? (
            <p className="text-white/45 text-sm">L&apos;offre sera disponible très prochainement.</p>
          ) : !status.authenticated ? (
            <Link href="/login?next=/credits-gratuits" className="btn-primary inline-flex items-center gap-2">
              Se connecter pour en profiter
            </Link>
          ) : blocked ? (
            <div className="card border-surface-border flex items-start gap-3">
              <Clock className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Quota atteint</p>
                <p className="text-white/50 text-sm mt-1">
                  Vous avez déjà reçu {dailyMax} × {reward} crédits ces dernières 24 h.
                  {status.resets_at && (
                    <> Revenez à partir du {new Date(status.resets_at).toLocaleString("fr-FR")}.</>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <>
              <a href="/api/linkvertise/start" className="btn-primary inline-flex items-center gap-2 text-base px-6 py-3">
                <Gift className="w-5 h-5" />
                Obtenir {reward} crédits gratuits
              </a>
              <p className="text-white/40 text-xs mt-3">
                {remaining} passage{remaining > 1 ? "s" : ""} restant{remaining > 1 ? "s" : ""} sur les 24 prochaines heures.
              </p>
            </>
          )}

          <div className="mt-10 flex items-start gap-3 text-white/35 text-xs leading-relaxed">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Chaque passage est vérifié auprès de Linkvertise. Les outils de
              contournement, les scripts automatisés et les comptes multiples ne
              créditent rien et peuvent entraîner la suspension du compte.
            </p>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}

export default function CreditsGratuitsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <CreditsGratuitsContent />
    </Suspense>
  );
}
