import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase";
import {
  LINKVERTISE_COOKIE,
  LINKVERTISE_DAILY_MAX,
  LINKVERTISE_FROM_COOKIE,
  LINKVERTISE_TICKET_TTL_MIN,
  buildLinkvertiseUrl,
  clientIp,
  linkvertiseConfigured,
  linkvertiseReturnPath,
} from "@/lib/linkvertise";

export const dynamic = "force-dynamic";

// GET /api/linkvertise/start
// Ouvre une tentative (ticket + quota), puis redirige vers le lien Linkvertise.
export async function GET(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(req.url).origin;
  const from = req.nextUrl.searchParams.get("from") === "dashboard" ? "dashboard" : "page";
  const returnPath = linkvertiseReturnPath(from);
  const back = (params: string) =>
    NextResponse.redirect(`${origin}${returnPath}${returnPath.includes("?") ? "&" : "?"}${params}`);

  if (!linkvertiseConfigured()) {
    return back("error=config");
  }

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(returnPath)}`);
  }

  const ticket = crypto.randomUUID().replace(/-/g, "");
  const admin = createSupabaseAdmin();

  const { data, error } = await admin.rpc("open_linkvertise_claim", {
    p_user_id:   user.id,
    p_ticket:    ticket,
    p_ip:        clientIp(req.headers),
    p_daily_max: LINKVERTISE_DAILY_MAX,
  });

  if (error) {
    console.error("open_linkvertise_claim error:", error);
    return back("error=migration");
  }

  const result = data as { ok: boolean; error?: string };
  if (!result?.ok) {
    return back(`error=quota&message=${encodeURIComponent(result?.error ?? "Quota atteint")}`);
  }

  const res = NextResponse.redirect(buildLinkvertiseUrl(ticket, origin));
  res.cookies.set(LINKVERTISE_COOKIE, ticket, {
    httpOnly: true,
    sameSite: "lax",          // renvoyé au retour depuis Linkvertise (navigation GET)
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: LINKVERTISE_TICKET_TTL_MIN * 60,
  });
  res.cookies.set(LINKVERTISE_FROM_COOKIE, from, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: LINKVERTISE_TICKET_TTL_MIN * 60,
  });
  return res;
}
