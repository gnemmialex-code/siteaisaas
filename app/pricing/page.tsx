"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Zap, Loader2, Sparkles, Crown, Infinity as InfinityIcon, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PRICING_FAQ } from "@/lib/faq";
import { PLAN_PRICES } from "@/lib/plans";

const PLANS = [
  {
    id: "plan_essentiel",
    name: "Essentiel",
    icon: <Zap className="w-5 h-5" />,
    credits: "2 500",
    creditsRaw: 2500,
    // Prix lus depuis lib/plans.ts, qui alimente aussi les `offers` du JSON-LD :
    // le prix balisé ne peut pas diverger du prix affiché.
    priceMonthly: PLAN_PRICES.plan_essentiel.monthly,
    priceYearly: PLAN_PRICES.plan_essentiel.yearly,
    color: "border-surface-border",
    badge: null,
    tagline: "Pour découvrir l'IA",
    highlights: [
      { label: "Qualité", value: "HD 1080p" },
      { label: "Vitesse", value: "~45-60 sec" },
      { label: "File d'attente", value: "Partagée" },
    ],
    features: [
      "Génération photo uniquement",
      "Qualité HD 1080p",
      "Vitesse standard (~45-60 secondes)",
      "File d'attente partagée",
      "Historique limité (30 images)",
      "Sans watermark",
      "Support standard (réponse 48-72h)",
      "Téléchargement en 1080p",
    ],
  },
  {
    id: "plan_pro",
    name: "Pro",
    icon: <Sparkles className="w-5 h-5" />,
    credits: "10 250",
    creditsRaw: 10250,
    bonusCredits: 1000,
    priceMonthly: PLAN_PRICES.plan_pro.monthly,
    color: "border-surface-border",
    badge: "Populaire",
    tagline: "Pour créer plus & mieux",
    highlights: [
      { label: "Qualité", value: "Ultra 4K" },
      { label: "Vitesse", value: "~20-30 sec" },
      { label: "File d'attente", value: "Accélérée" },
    ],
    features: [
      "Photo + Vidéo jusqu'à 5 secondes",
      "Qualité Ultra 4K (upscale x4)",
      "🔥 Technique Snap Rouge incluse",
      "Vitesse prioritaire (~20-30 secondes)",
      "File d'attente accélérée",
      "Historique illimité",
      "Support prioritaire (réponse sous 24h)",
      "Partage direct réseaux sociaux",
      "API basique (100 req/jour)",
      "Statistiques d'usage détaillées",
    ],
  },
  {
    id: "plan_ultra",
    name: "Elite",
    icon: <Crown className="w-5 h-5" />,
    credits: "Illimité",
    creditsRaw: null,
    priceMonthly: PLAN_PRICES.plan_ultra.monthly,
    color: "border-accent-neon/50",
    badge: "Meilleure valeur",
    tagline: "L'expérience sans compromis",
    highlights: [
      { label: "Qualité", value: "8K Photoréaliste" },
      { label: "Vitesse", value: "~10-15 sec" },
      { label: "File d'attente", value: "Priorité absolue" },
    ],
    features: [
      "Photo + Vidéo 4K jusqu'à 30 secondes",
      "Qualité Ultra 8K — Photoréalisme maximum",
      "🔥 Technique Snap Rouge incluse",
      "Vitesse ultra (~10-15 secondes)",
      "Priorité absolue — jamais d'attente",
      "Licence commerciale incluse",
      "API illimitée (sans restriction)",
      "Accès bêta en avant-première",
      "Manager de compte dédié",
      "Support VIP dédié (réponse < 4h)",
    ],
  },
];

// Le texte de la FAQ vit dans lib/faq.ts : il alimente à la fois cet affichage
// et le balisage FAQPage de app/pricing/layout.tsx.
const FAQ = PRICING_FAQ;

function formatPrice(price: number) {
  return price.toFixed(2).replace(".", ",") + "€";
}

export default function PricingPage() {
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  /* Mobile : la formule face à l'écran s'agrandit (via whileInView) et les
     autres s'assombrissent — équivalent tactile du survol souris sur desktop. */
  const [isMobile, setIsMobile] = useState(false);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    setLoadingPlan(plan.id);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, billing }),
      });
      const data = await res.json();

      if (res.status === 401) {
        toast("Connectez-vous pour souscrire à un plan", { icon: "🔒" });
        router.push("/login?redirect=/pricing");
        return;
      }
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Erreur lors de la création de la session de paiement");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* ── Fond animé global ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Halos en radial-gradient (pas de filter: blur — rendu fiable sur mobile/Safari) */}
        <motion.div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(138,43,226,0.30) 0%, rgba(138,43,226,0.12) 40%, transparent 70%)" }}
          animate={{ x: [0, 60, -20, 0], y: [0, 40, -15, 0], scale: [1, 1.2, 0.9, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -right-40 w-[420px] h-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,229,255,0.22) 0%, rgba(0,229,255,0.08) 40%, transparent 70%)" }}
          animate={{ x: [0, -50, 20, 0], y: [0, 60, -20, 0], scale: [1, 1.3, 0.95, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 w-[360px] h-[360px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(138,43,226,0.25) 0%, rgba(138,43,226,0.10) 40%, transparent 70%)" }}
          animate={{ x: [0, 40, -30, 0], y: [0, -40, 20, 0], scale: [1, 1.15, 0.92, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
        {/* Orbe rose supplémentaire — centre */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.20) 0%, rgba(236,72,153,0.08) 40%, transparent 70%)" }}
          animate={{ scale: [1, 1.5, 0.9, 1], opacity: [0.4, 0.9, 0.5, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Particules flottantes */}
        {[
          { x: "10%",  y: "15%", r: 3, dur: 4.2, delay: 0   },
          { x: "88%",  y: "8%",  r: 2, dur: 5.1, delay: 1.3 },
          { x: "25%",  y: "60%", r: 4, dur: 3.8, delay: 0.6 },
          { x: "75%",  y: "45%", r: 2, dur: 6.0, delay: 2.1 },
          { x: "55%",  y: "80%", r: 3, dur: 4.6, delay: 0.9 },
          { x: "40%",  y: "25%", r: 2, dur: 5.5, delay: 1.7 },
          { x: "5%",   y: "45%", r: 2, dur: 4.9, delay: 2.8 },
          { x: "93%",  y: "65%", r: 3, dur: 5.7, delay: 0.4 },
          { x: "18%",  y: "88%", r: 2, dur: 4.4, delay: 1.9 },
          { x: "65%",  y: "12%", r: 3, dur: 5.3, delay: 3.2 },
          { x: "35%",  y: "72%", r: 2, dur: 6.3, delay: 0.2 },
          { x: "82%",  y: "30%", r: 4, dur: 4.0, delay: 2.5 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-accent-violet/60"
            style={{ left: p.x, top: p.y, width: p.r * 2, height: p.r * 2, boxShadow: "0 0 8px rgba(138,43,226,0.7)" }}
            animate={{ y: [0, -20, 0], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}

        {/* Particules qui montent du bas de l'écran */}
        {Array.from({ length: 26 }, (_, i) => ({
          left: `${(i * 41 + 7) % 100}%`,
          size: 1.5 + ((i * 7) % 3),
          dur: 7 + ((i * 13) % 9),
          delay: (i * 1.9) % 10,
          violet: i % 3 !== 0,
        })).map((p, i) => (
          <span
            key={`rise-${i}`}
            className={`absolute rounded-full ${p.violet ? "bg-accent-violet" : "bg-white"}`}
            style={{
              left: p.left,
              bottom: -8,
              width: p.size,
              height: p.size,
              opacity: 0,
              boxShadow: p.violet ? "0 0 6px rgba(138,43,226,0.9)" : "0 0 6px rgba(255,255,255,0.7)",
              animation: `particle-rise ${p.dur}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl sm:text-6xl font-black mb-4">
            Choisissez votre <span className="gradient-text">plan</span>
          </h1>
          <p className="text-white/50 text-xl max-w-xl mx-auto mb-8">
            Des générations illimitées pour transformer vos photos et vidéos en haute définition.
          </p>

          {/* Toggle mensuel / annuel */}
          <div className="inline-flex items-center gap-1 bg-surface border border-surface-border rounded-2xl p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                billing === "monthly"
                  ? "bg-accent-violet text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                billing === "yearly"
                  ? "bg-accent-violet text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Annuel
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-bold">
                −17%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plans */}
        {/* Titre de niveau 2 réservé aux lecteurs d'écran et aux crawlers : la
            grille de formules n'a pas de titre visible, et sans lui les noms de
            plans (h3) sauteraient directement du h1 au h3. */}
        <h2 className="sr-only">Nos formules d&apos;abonnement</h2>
        <div className="plans-grid grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 mb-16">
          {PLANS.map((plan, i) => {
            const monthlyPrice = plan.priceMonthly;
            const yearlyTotal: number =
              "priceYearly" in plan && typeof plan.priceYearly === "number"
                ? plan.priceYearly
                : +(monthlyPrice * 12 * 0.83).toFixed(2);
            const yearlyPerMonth = +(yearlyTotal / 12).toFixed(2);

            const displayPrice = billing === "monthly" ? monthlyPrice : yearlyPerMonth;
            const displayTotal = billing === "yearly" ? yearlyTotal : null;

            const isPro   = plan.badge === "Populaire";
            const isElite = plan.name === "Elite";

            // Mobile : cartes légèrement réduites (l'espacement du gap ressort davantage),
            // l'effet de zoom au scroll est conservé mais reste sous la taille desktop.
            const baseScale  = isMobile ? 0.92 : (isPro ? 1.06 : 1);
            const grownScale = isMobile ? 0.96 : (isPro ? 1.11 : 1.05);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0, scale: baseScale }}
                whileHover={{ scale: grownScale }}
                {...(isMobile
                  ? {
                      /* Les cartes sont plus hautes que l'écran d'un téléphone :
                         un seuil bas + une marge centrée garantissent le déclenchement. */
                      whileInView: { scale: grownScale },
                      viewport: { amount: 0.3, margin: "-15% 0px -15% 0px" },
                      onViewportEnter: () => setActiveCard(i),
                      onViewportLeave: () => setActiveCard((prev) => (prev === i ? null : prev)),
                    }
                  : {})}
                transition={{ delay: i * 0.1, scale: { delay: 0, duration: 0.25 } }}
                className={`plan-card relative card border-2 ${plan.color} flex flex-col bg-surface ${
                  isPro ? "z-10" : ""
                } ${isMobile && activeCard !== null && activeCard !== i ? "plan-card-dimmed" : ""}`}
              >
                {/* Étincelles qui s'échappent du haut de la carte (Pro : vertes, Elite : or) */}
                {(isPro || isElite) && (
                  <div className="absolute top-0 left-0 right-0 h-0 pointer-events-none">
                    {Array.from({ length: 10 }, (_, k) => ({
                      left: `${((k * 11 + 8) % 88) + 6}%`,
                      size: 2 + (k % 3),
                      dur: 2.2 + ((k * 7) % 20) / 10,
                      delay: (k * 0.6) % 3,
                    })).map((s, k) => (
                      <span
                        key={k}
                        className="absolute rounded-full"
                        style={{
                          left: s.left,
                          top: -2,
                          width: s.size,
                          height: s.size,
                          background: isPro ? "#39ff14" : "#ffd700",
                          boxShadow: `0 0 6px ${isPro ? "rgba(57,255,20,0.9)" : "rgba(255,215,0,0.9)"}`,
                          opacity: 0,
                          animation: `sparkle-up ${s.dur}s ease-out ${s.delay}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs px-4 py-1 rounded-full font-bold whitespace-nowrap ${
                    plan.badge === "Populaire" ? "bg-accent-violet" : "bg-gradient-violet-neon"
                  }`}>
                    {plan.badge}
                  </div>
                )}

                {/* Nom & icône */}
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    plan.name === "Elite"
                      ? "bg-accent-neon/15 text-accent-neon"
                      : "bg-accent-violet/15 text-accent-violet"
                  }`}>
                    {plan.icon}
                  </div>
                  <h3 className={`text-xl font-bold ${(isPro || isElite) ? "violetblue-shimmer-text" : ""}`}>{plan.name}</h3>
                </div>
                <p className="text-white/40 text-xs mb-5">{plan.tagline}</p>

                {/* Prix */}
                <div className="mb-2">
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-black ${isPro ? "violetblue-shimmer-text" : ""}`}>{formatPrice(displayPrice)}</span>
                    <span className="text-white/40 text-sm mb-1">/mois</span>
                  </div>
                  {displayTotal && (
                    <p className="text-white/30 text-xs mt-1">
                      soit {formatPrice(displayTotal)} facturés annuellement
                    </p>
                  )}
                </div>

                {/* Générations illimitées (toutes les formules) */}
                <div className="text-center mb-4 py-4 bg-surface-hover rounded-xl relative overflow-hidden">
                  <div className="flex items-center justify-center gap-2">
                    <InfinityIcon className="w-8 h-8 text-accent-violet" />
                    <span className="text-2xl font-black violetblue-shimmer-text">Illimité</span>
                  </div>
                  <p className="text-white/50 text-sm mt-1">générations / mois</p>
                </div>

                {/* Highlights — qualité / vitesse / file */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {plan.highlights.map((h) => (
                    <div key={h.label} className="bg-surface-hover rounded-lg px-2 py-2 text-center">
                      <p className="text-white/80 text-[10px] uppercase tracking-wide mb-0.5">{h.label}</p>
                      <p className="text-xs font-bold leading-tight text-white">{h.value}</p>
                    </div>
                  ))}
                </div>

                {/* Features — les 3 premières = différences majeures, en blanc et plus grandes */}
                <ul className="space-y-2 mb-8 flex-1">
                  {plan.features.map((feature, fi) => (
                    <li key={feature} className={`flex items-start gap-2 ${
                      fi < 3 ? "text-[15px] text-white font-bold" : "text-sm text-white/60"
                    }`}>
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        plan.name === "Elite" ? "text-accent-neon" : "text-accent-violet"
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={!!loadingPlan}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    plan.name === "Elite"
                      ? "bg-gradient-to-r from-accent-neon/80 to-accent-violet text-white hover:opacity-90"
                      : plan.badge === "Populaire"
                      ? "btn-primary"
                      : "btn-secondary"
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {plan.name === "Elite" ? <Crown className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                      {plan.name === "Elite" ? "Accès Elite" : "Commencer"}
                    </>
                  )}
                </button>

                {/* Garantie sous le bouton */}
                <p className="flex items-center justify-center gap-1.5 mt-3 text-green-400/80 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                  Satisfait ou remboursé sous 48h
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Comment ça marche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16"
        >
          <div className="card border-accent-violet/20 bg-accent-violet/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-violet/15 rounded-xl flex items-center justify-center text-accent-violet flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-white">Sans abonnement</p>
              <p className="text-white/50 text-sm">Aperçu flouté gratuit</p>
            </div>
          </div>
          <div className="card border-accent-neon/20 bg-accent-neon/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-neon/10 rounded-xl flex items-center justify-center text-accent-neon flex-shrink-0">
              <InfinityIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-white">Avec abonnement</p>
              <p className="text-white/50 text-sm">Rendu net illimité en HD</p>
            </div>
          </div>
        </motion.div>

        {/* Démarrage gratuit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card border-accent-neon/20 bg-accent-neon/5 text-center mb-16"
        >
          {/* Bloc de niveau section, au même rang que « Questions fréquentes » */}
          <h2 className="text-2xl font-bold mb-2">Essayez gratuitement</h2>
          <p className="text-white/50 mb-4">
            Créez un compte gratuit et générez un aperçu de votre transformation. Débloquez le rendu net en HD avec un abonnement. Aucune carte bancaire requise pour tester.
          </p>
          <a href="/register" className="btn-primary inline-flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Créer mon compte gratuit
          </a>
        </motion.div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">
            Questions <span className="gradient-text">fréquentes</span>
          </h2>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card"
              >
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
