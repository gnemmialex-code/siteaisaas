import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

// Inscription directe sans confirmation d'email.
// On crée l'utilisateur côté serveur avec email_confirm: true (clé service-role),
// ce qui déclenche le trigger on_auth_user_created (ligne users + 100 crédits).
// Le client se connecte ensuite immédiatement avec son mot de passe.
export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit faire 8 caractères minimum" },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdmin();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // marque l'email comme confirmé → connexion immédiate possible
    });

    // Filet de sécurité : le trigger handle_new_user déployé en base crée encore
    // les comptes en 'plan_essentiel' (considéré comme PAYANT). On force 'free'
    // pour que les nouveaux inscrits aient bien des résultats floutés (aperçu).
    if (data?.user?.id) {
      await admin.from("users").update({ plan_id: "free" }).eq("id", data.user.id);
    }

    if (error) {
      // Compte déjà existant
      const msg = error.message || "";
      if (
        msg.toLowerCase().includes("already") ||
        msg.toLowerCase().includes("registered") ||
        error.status === 422
      ) {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cet email" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: msg || "Erreur lors de l'inscription" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
