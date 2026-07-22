"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";
import { isPaidPlan } from "@/lib/plan";

// Badge de statut d'abonnement (remplace l'ancien compteur de crédits).
// Abonné payant → « Abonné » ; compte gratuit → CTA « Passer en HD ».
export default function CreditCounter() {
  const [plan, setPlan] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => {
        setAuthed(!!d.authenticated);
        setPlan(d.plan ?? null);
      })
      .catch(() => setAuthed(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-8 w-24 shimmer-bg rounded-lg" />;
  }

  if (!authed) return null;

  if (isPaidPlan(plan)) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-accent-violet/10 border-accent-violet/30 text-accent-violet text-sm font-medium">
        <Crown className="w-3.5 h-3.5" />
        <span>Abonné</span>
      </div>
    );
  }

  return (
    <Link
      href="/pricing"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-accent-violet/10 border-accent-violet/30 text-accent-violet text-sm font-medium hover:bg-accent-violet/20 transition-colors"
    >
      <Sparkles className="w-3.5 h-3.5" />
      <span>Passer en HD</span>
    </Link>
  );
}
