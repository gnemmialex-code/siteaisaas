import type Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Fulfillment partagé entre le webhook Stripe et le filet de sécurité au retour
// sur /dashboard. Idempotent : la table credit_transactions a une contrainte
// UNIQUE sur stripe_session_id, qu'on utilise comme verrou. On insère la
// transaction EN PREMIER : si elle existe déjà (doublon), on n'applique rien.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type FulfillResult = { applied: boolean; reason?: string };

export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<FulfillResult> {
  // Ne traite que les paiements réellement réglés
  if (session.payment_status && session.payment_status !== "paid") {
    return { applied: false, reason: "unpaid" };
  }

  // ── Achat unique Snap Rouge → accès à vie ──
  if (session.metadata?.product === "snap_rouge") {
    const snapUserId = session.metadata?.user_id;
    if (!snapUserId) return { applied: false, reason: "missing_user" };

    // Verrou idempotent
    const { error: lockErr } = await supabaseAdmin.from("credit_transactions").insert({
      user_id:           snapUserId,
      amount:            0,
      type:              "purchase",
      pack_id:           "snap_rouge",
      stripe_session_id: session.id,
    });
    if (lockErr) {
      if (lockErr.code === "23505") return { applied: false, reason: "already" }; // doublon
      throw new Error(lockErr.message);
    }

    await supabaseAdmin
      .from("users")
      .update({ snap_rouge_access: true, updated_at: new Date().toISOString() })
      .eq("id", snapUserId);

    return { applied: true };
  }

  // ── Abonnement / pack de crédits ──
  const userId  = session.metadata?.user_id;
  const credits = parseInt(session.metadata?.credits ?? "0", 10);
  const packId  = session.metadata?.pack_id;
  const planId  = session.metadata?.plan_id ?? packId ?? null;

  if (!userId || !credits) return { applied: false, reason: "missing_metadata" };

  // Verrou idempotent : insère la transaction d'abord
  const { error: lockErr } = await supabaseAdmin.from("credit_transactions").insert({
    user_id:           userId,
    amount:            credits,
    type:              "purchase",
    pack_id:           packId,
    stripe_session_id: session.id,
  });
  if (lockErr) {
    if (lockErr.code === "23505") return { applied: false, reason: "already" }; // déjà appliqué
    throw new Error(lockErr.message);
  }

  try {
    // Crédite + met à jour le plan via lecture/écriture directe (pas de dépendance
    // à une fonction RPC SQL qui pourrait être absente de la base déployée).
    const { data: u, error: readErr } = await supabaseAdmin
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();
    if (readErr) throw new Error(readErr.message);

    const newCredits = (u?.credits ?? 0) + credits;
    const patch: Record<string, unknown> = { credits: newCredits, updated_at: new Date().toISOString() };
    if (planId) patch.plan_id = planId;

    const { error: updErr } = await supabaseAdmin.from("users").update(patch).eq("id", userId);
    if (updErr) throw new Error(updErr.message);
  } catch (e) {
    // Annule le verrou pour qu'une nouvelle tentative reste possible
    await supabaseAdmin.from("credit_transactions").delete().eq("stripe_session_id", session.id);
    throw e;
  }

  return { applied: true };
}
