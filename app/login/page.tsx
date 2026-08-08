"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import Input from "../components/Input";
import { supabase } from "@/lib/supabase";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Listen for SIGNED_IN event — fires after session cookie is fully set
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        window.location.href = "/dashboard";
      }
    });
    return () => subscription.unsubscribe();
  }, []);;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email) errs.email = "Email requis";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Email invalide";
    if (!password) errs.password = "Mot de passe requis";
    return errs;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Connexion réussie !");
      // redirect handled by onAuthStateChange above
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion";
      toast.error(msg === "Invalid login credentials" ? "Email ou mot de passe incorrect" : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setErrors({ email: "Entrez votre email pour recevoir le lien" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      toast.success("Lien magique envoyé ! Vérifiez votre email.");
    } catch {
      toast.error("Erreur d'envoi");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google") => {
    setOauthLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion";
      toast.error(msg);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-accent-violet/15 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            {/* next/image et non <img> brut : le fichier source fait 2000×2000
                pour 206 Ko et il était servi tel quel pour un rendu de 56 px.
                alt vide : le nom « AstraCrea » suit immédiatement dans le même
                lien, le répéter ferait annoncer la marque deux fois. */}
            <Image src="/logo2.png" alt="" width={56} height={56} priority className="h-14 w-auto rounded-xl" />
            <span className="font-black text-2xl tracking-tight">Astra<span className="gradient-text">Crea</span></span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Connexion</h1>
          <p className="text-white/50">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-accent-violet hover:underline">
              S&apos;inscrire gratuitement
            </Link>
          </p>
        </div>

        <div className="card">
          {/* OAuth buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-surface-border bg-white/5 hover:bg-white/10 transition-all text-sm font-medium text-white disabled:opacity-50"
            >
              <GoogleIcon />
              {oauthLoading === "google" ? "Redirection..." : "Continuer avec Google"}
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface px-3 text-white/30 text-sm">ou</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Mot de passe"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                icon={<Lock className="w-4 h-4" />}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-white/40 hover:text-white transition-colors">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface px-3 text-white/30 text-sm">ou</span>
            </div>
          </div>

          <button
            onClick={handleMagicLink}
            disabled={loading}
            className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Lien magique par email
          </button>
        </div>
      </motion.div>
    </div>
  );
}
