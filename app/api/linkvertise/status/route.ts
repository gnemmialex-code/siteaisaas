import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase";
import {
  LINKVERTISE_DAILY_MAX,
  LINKVERTISE_REWARD,
  linkvertiseConfigured,
} from "@/lib/linkvertise";

export const dynamic = "force-dynamic";

// GET /api/linkvertise/status → état de l'offre pour le compte connecté
export async function GET() {
  const base = {
    reward:     LINKVERTISE_REWARD,
    daily_max:  LINKVERTISE_DAILY_MAX,
    configured: linkvertiseConfigured(),
  };

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ...base, authenticated: false, remaining: LINKVERTISE_DAILY_MAX });
  }

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const admin = createSupabaseAdmin();

  const { data, error } = await admin
    .from("linkvertise_claims")
    .select("rewarded_at")
    .eq("user_id", user.id)
    .eq("status", "rewarded")
    .gt("rewarded_at", since)
    .order("rewarded_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { ...base, authenticated: true, error: "Exécutez supabase/migration-linkvertise.sql" },
      { status: 503 }
    );
  }

  const used = data?.length ?? 0;
  const oldest = data?.[0]?.rewarded_at as string | undefined;

  return NextResponse.json({
    ...base,
    authenticated: true,
    used_24h:      used,
    remaining:     Math.max(0, LINKVERTISE_DAILY_MAX - used),
    // Moment où un nouveau passage se libère si le quota est atteint
    resets_at:     used >= LINKVERTISE_DAILY_MAX && oldest
      ? new Date(new Date(oldest).getTime() + 24 * 3600 * 1000).toISOString()
      : null,
  });
}
