"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Gift, Play, Lock, LogIn, UserPlus, Clock, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Loader2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Bloc « Tester gratuitement en regardant des pubs » (Linkvertise)
// • variant="section"   → section de la page d'accueil
// • variant="dashboard" → vue du Dashboard (affiche aussi le résultat du retour)
// Compte obligatoire : les invités sont envoyés vers l'inscription / connexion.
// ─────────────────────────────────────────────────────────────────────────────

type Status = {
  reward: number;
  daily_max: number;
  configured: boolean;
  authenticated: boolean;
  remaining: number;
  resets_at?: string | null;
};

const ERRORS: Record<string, string> = {
  config:         "L'offre n'est pas encore disponible. Revenez un peu plus tard.",
  not_configured: "L'offre n'est pas encore disponible. Revenez un peu plus tard.",
  migration:      "Offre momentanément indisponible.",
  session:        "Session expirée. Relancez l'opération.",
  missing_hash:   "Les étapes n'ont pas été validées. Réessayez jusqu'au bout.",
  invalid_hash:   "Validation refusée : les étapes n'ont pas été terminées correctement.",
  invalid_token:  "Vérification indisponible pour le moment. Réessayez plus tard.",
  network:        "Impossible de vérifier votre passage. Réessayez dans un instant.",
  quota:          "Quota atteint pour aujourd'hui.",
  refused:        "Récompense refusée.",
};

const STEPS = [
  { icon: Play,         title: "Regardez",  text: "Quelques pubs rapides sur notre partenaire" },
  { icon: CheckCircle2, title: "Validez",    text: "Suivez les étapes jusqu'au bout" },
  { icon: Gift,         title: "Générez",    text: "Vos crédits arrivent automatiquement" },
];

export default function FreeCreditsAds({ variant }: { variant: "section" | "dashboard" }) {
  const [status,  setStatus]  = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [result,  setResult]  = useState<{ ok: boolean; credits?: string; message?: string } | null>(null);

  const isDashboard = variant === "dashboard";
  const returnPath  = isDashboard ? "/dashboard?view=freecredits" : "/credits-gratuits";
  const startHref   = `/api/linkvertise/start${isDashboard ? "?from=dashboard" : ""}`;
  const nextParam   = encodeURIComponent(returnPath);

  useEffect(() => {
    fetch("/api/linkvertise/status")
      .then((r) => r.json())
      .then((d: Status) => setStatus(d))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));

    if (!isDashboard) return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("ok") === "1") {
      setResult({ ok: true, credits: p.get("credits") ?? undefined });
    } else if (p.get("error")) {
      const key = p.get("error")!;
      setResult({ ok: false, message: p.get("message") || ERRORS[key] || "Une erreur est survenue." });
    }
  }, [isDashboard]);

  const reward    = status?.reward ?? 100;
  const dailyMax  = status?.daily_max ?? 3;
  const remaining = status?.remaining ?? dailyMax;

  /* ── Zone d'action selon l'état ── */
  const action = loading ? (
    <div className="flex justify-center py-3">
      <Loader2 className="w-6 h-6 text-accent-violet animate-spin" />
    </div>
  ) : !status?.configured ? (
    <p className="text-white/45 text-xs sm:text-sm text-center">L&apos;offre sera disponible très prochainement.</p>
  ) : !status.authenticated ? (
    <div className="text-center">
      <p className="text-white/60 text-[11px] sm:text-sm mb-2.5 sm:mb-4 flex items-center justify-center gap-2">
        <Lock className="w-4 h-4" />
        Un compte gratuit est nécessaire pour recevoir vos crédits
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
        <Link href={`/register?next=${nextParam}`} className="btn-primary flex items-center gap-2 text-sm px-5 sm:px-6 py-2.5 sm:py-3">
          <UserPlus className="w-4 h-4" />
          Créer mon compte gratuit
        </Link>
        <Link
          href={`/login?next=${nextParam}`}
          className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-3 rounded-xl border border-accent-violet/40 text-accent-violet hover:bg-accent-violet/10 text-sm font-bold transition-all"
        >
          <LogIn className="w-4 h-4" />
          J&apos;ai déjà un compte
        </Link>
      </div>
    </div>
  ) : remaining <= 0 ? (
    <div className="flex items-start gap-3 justify-center text-center sm:text-left">
      <Clock className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-white">Quota atteint pour aujourd&apos;hui</p>
        <p className="text-white/50 text-sm mt-1">
          {status.resets_at
            ? <>Nouveau passage disponible le {new Date(status.resets_at).toLocaleString("fr-FR")}.</>
            : "Revenez dans 24 h pour de nouveaux crédits."}
        </p>
      </div>
    </div>
  ) : (
    <div className="text-center">
      <motion.a
        href={startHref}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="btn-primary inline-flex items-center gap-2 text-sm sm:text-base px-5 sm:px-7 py-2.5 sm:py-3.5"
      >
        <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
        Regarder les pubs et gagner {reward} crédits
      </motion.a>
      <p className="text-white/40 text-[10px] sm:text-xs mt-2 sm:mt-3">
        {remaining} passage{remaining > 1 ? "s" : ""} restant{remaining > 1 ? "s" : ""} sur 24 h · environ 1 minute
      </p>
    </div>
  );

  const steps = !isDashboard ? (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
      {STEPS.map(({ icon: Icon, title, text }, i) => (
        <div key={title} className="flex flex-col items-center text-center gap-1 sm:gap-3 rounded-xl sm:rounded-2xl border border-surface-border bg-surface-hover/40 p-2 sm:p-4">
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-accent-violet/15 flex items-center justify-center text-accent-violet flex-shrink-0">
            <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="font-bold text-white text-[11px] sm:text-sm">{i + 1}. {title}</p>
            <p className="hidden sm:block text-white/45 text-xs leading-relaxed">{text}</p>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {STEPS.map(({ icon: Icon, title, text }, i) => (
        <div key={title} className="flex sm:flex-col items-center sm:text-center gap-3 rounded-2xl border border-surface-border bg-surface-hover/40 p-4">
          <div className="w-10 h-10 rounded-xl bg-accent-violet/15 flex items-center justify-center text-accent-violet flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">{i + 1}. {title}</p>
            <p className="text-white/45 text-xs leading-relaxed">{text}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const disclaimer = (
    <p className="flex items-start justify-center gap-2 text-white/30 text-[10px] sm:text-[11px] leading-snug sm:leading-relaxed mt-3 sm:mt-5">
      <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      Chaque passage est vérifié. Les outils de contournement et les comptes multiples ne créditent rien.
    </p>
  );

  /* ── Vue Dashboard ── */
  if (isDashboard) {
    return (
      <div className="max-w-3xl space-y-5">
        {result?.ok && (
          <div className="card border-green-500/30 bg-green-500/10 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">+{result.credits ?? reward} crédits ajoutés à votre compte</p>
              <p className="text-white/50 text-sm mt-0.5">Vous pouvez lancer votre génération dès maintenant.</p>
            </div>
          </div>
        )}
        {result && !result.ok && (
          <div className="card border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-white/80 text-sm">{result.message}</p>
          </div>
        )}

        <div className="card border-accent-violet/25 bg-accent-violet/5 text-center py-8">
          <p className="text-5xl font-black gradient-text mb-1">+{reward}</p>
          <p className="text-white/60 text-sm">crédits de vraie génération, sans payer</p>
        </div>

        {steps}

        <div className="card">{action}</div>
        {disclaimer}
      </div>
    );
  }

  /* ── Section page d'accueil ── */
  return (
    <section className="py-3 sm:py-20 px-4 sm:px-6 relative overflow-hidden">
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-64 rounded-full bg-accent-violet/10 blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-3xl mx-auto card border-accent-violet/30 p-3.5 sm:p-10"
      >
        <div className="text-center mb-3 sm:mb-8">
          <span className="inline-flex items-center gap-2 bg-accent-neon/10 border border-accent-neon/30 text-accent-neon text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full mb-2 sm:mb-4">
            <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Essai gratuit
          </span>
          <h2 className="text-base sm:text-4xl font-black mb-1 sm:mb-3">
            Testez <span className="gradient-text">gratuitement</span> en regardant quelques pubs
          </h2>
          <p className="text-white/55 text-[11px] sm:text-base max-w-xl mx-auto">
            Pas de carte bancaire : regardez quelques pubs rapides et recevez{" "}
            <strong className="text-white">{reward} crédits</strong> pour une vraie génération.
          </p>
        </div>

        <div className="mb-3 sm:mb-8">{steps}</div>

        {action}
        {disclaimer}

        {status?.authenticated && (
          <div className="text-center mt-2 sm:mt-4">
            <Link href="/dashboard?view=freecredits" className="text-accent-violet text-[10px] sm:text-xs hover:underline inline-flex items-center gap-1">
              Suivre mes crédits offerts dans le Dashboard <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </motion.div>
    </section>
  );
}
