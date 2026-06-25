import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseServer } from "@/lib/supabase-server";
import { fulfillCheckoutSession } from "@/lib/stripe-fulfill";

// Filet de sécurité : appelé au retour sur /dashboard après paiement
// (?session_id=...). Vérifie la session directement auprès de Stripe et applique
// le plan/crédits si ce n'est pas déjà fait — fonctionne SANS webhook.
// Idempotent (verrou sur credit_transactions.stripe_session_id).
export async function POST(req: NextRequest) {
  const { data: { user } } = await (await createSupabaseServer()).auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { sessionId } = (await req.json()) as { sessionId?: string };
  if (!sessionId) {
    return NextResponse.json({ error: "session_id manquant" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Sécurité : la session doit appartenir à l'utilisateur connecté
    if (session.metadata?.user_id !== user.id) {
      return NextResponse.json({ error: "Session non autorisée" }, { status: 403 });
    }

    const result = await fulfillCheckoutSession(session);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur de confirmation";
    console.error("[Stripe confirm] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
