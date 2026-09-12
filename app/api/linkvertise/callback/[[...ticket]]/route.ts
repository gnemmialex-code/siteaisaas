import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase";
import {
  LINKVERTISE_COOKIE,
  LINKVERTISE_DAILY_MAX,
  LINKVERTISE_FROM_COOKIE,
  LINKVERTISE_REWARD,
  LINKVERTISE_TICKET_TTL_MIN,
  linkvertiseReturnPath,
  verifyLinkvertiseHash,
} from "@/lib/linkvertise";

export const dynamic = "force-dynamic";

// GET /api/linkvertise/callback?hash=...        (lien statique + cookie)
// GET /api/linkvertise/callback/<ticket>?hash=… (lien dynamique)
//
// C'est l'URL de DESTINATION à déclarer dans Linkvertise. Linkvertise y ajoute
// lui-même ?hash=<...> quand l'anti-bypass est activé.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticket?: string[] }> }
) {
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(req.url).origin;
  const returnPath = linkvertiseReturnPath(req.cookies.get(LINKVERTISE_FROM_COOKIE)?.value);
  const back = (params: string) => {
    const res = NextResponse.redirect(`${origin}${returnPath}${returnPath.includes("?") ? "&" : "?"}${params}`);
    res.cookies.delete(LINKVERTISE_COOKIE);
    res.cookies.delete(LINKVERTISE_FROM_COOKIE);
    return res;
  };

  const hash = req.nextUrl.searchParams.get("hash");
  const { ticket: segments } = await params;
  const ticket = segments?.[0] ?? req.cookies.get(LINKVERTISE_COOKIE)?.value ?? null;

  if (!ticket) {
    return back("error=session");
  }

  // 1. Le hash doit être validé par Linkvertise (il est détruit après le 1er appel)
  const check = await verifyLinkvertiseHash(hash);
  if (!check.ok) {
    return back(`error=${check.reason}`);
  }

  // 2. Le ticket désigne le compte à créditer — on ne se fie pas seulement à la session
  const admin = createSupabaseAdmin();
  const { data: claim, error: claimErr } = await admin
    .from("linkvertise_claims")
    .select("user_id")
    .eq("ticket", ticket)
    .maybeSingle();

  if (claimErr) {
    console.error("linkvertise_claims select error:", claimErr);
    return back("error=migration");
  }

  let userId = claim?.user_id as string | undefined;
  if (!userId) {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return back("error=session");
    userId = user.id;
  }

  // 3. Versement atomique : un seul crédit par hash, quota 24 h respecté
  const { data, error } = await admin.rpc("claim_linkvertise_reward", {
    p_user_id:   userId,
    p_ticket:    ticket,
    p_hash:      hash,
    p_reward:    LINKVERTISE_REWARD,
    p_daily_max: LINKVERTISE_DAILY_MAX,
    p_ttl_min:   LINKVERTISE_TICKET_TTL_MIN,
  });

  if (error) {
    console.error("claim_linkvertise_reward error:", error);
    return back("error=migration");
  }

  const result = data as { ok: boolean; credits?: number; error?: string };
  if (!result?.ok) {
    return back(`error=refused&message=${encodeURIComponent(result?.error ?? "Récompense refusée")}`);
  }

  return back(`ok=1&credits=${result.credits ?? LINKVERTISE_REWARD}`);
}
