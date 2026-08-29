import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Rétention 48h : purge les générations expirées avant de renvoyer l'historique
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("generations")
    .delete()
    .eq("user_id", user.id)
    .lt("created_at", cutoff);

  const { data: generations, error } = await supabase
    .from("generations")
    .select("id, output_image_url, input_image_url, style, created_at")
    .eq("user_id", user.id)
    .eq("status", "done")
    .neq("output_image_url", "")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: "Erreur de récupération" }, { status: 500 });
  }

  return NextResponse.json({ generations: generations ?? [] });
}

export async function DELETE() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { error } = await supabase
    .from("generations")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Erreur de suppression" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
