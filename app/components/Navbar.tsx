"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import CreditCounter from "./CreditCounter";

const NAV_LINKS = [
  { href: "/upload", label: "Générer" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [userEmail,   setUserEmail]   = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-surface-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {/* next/image et non <img> brut : le fichier source fait 2000×2000
                pour 206 Ko, et il était servi tel quel — puis préchargé — pour
                un rendu de 44 px. Il descend ici à quelques kilo-octets en AVIF.
                width/height déclarés : la barre ne se réajuste plus au
                chargement (CLS). */}
            {/* alt vide : le mot « AstraCrea » est déjà écrit juste à côté,
                dans le même lien. Un alt qui le répète fait annoncer la marque
                deux fois de suite par un lecteur d'écran. */}
            <Image
              src="/logo2.png"
              alt=""
              width={44}
              height={44}
              priority
              className="h-11 w-auto rounded-xl"
            />
            <span className="font-black text-lg tracking-tight">Astra<span className="gradient-text">Crea</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-white bg-surface-hover"
                    : "text-white/60 hover:text-white hover:bg-surface-hover"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <CreditCounter />
            {userEmail ? (
              <Link href="/dashboard" className="btn-ghost text-sm flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-violet-neon flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                  {userEmail[0].toUpperCase()}
                </div>
                <span className="max-w-[140px] truncate">{userEmail}</span>
              </Link>
            ) : (
              <Link href="/login" className="btn-ghost text-sm">
                Connexion
              </Link>
            )}
            <Link href="/upload" className="btn-primary text-sm px-4 py-2 flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Générer
            </Link>
          </div>

          {/* Mobile toggle */}
          {/* Le bouton ne contient qu'une icône : sans aria-label, un lecteur
              d'écran l'annonce comme « bouton », sans dire ce qu'il fait. */}
          <button
            className="md:hidden btn-ghost p-2"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-surface-border"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-surface-hover transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-surface-border flex flex-col gap-2">
                <CreditCounter />
                {userEmail ? (
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="btn-secondary text-center flex items-center justify-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-violet-neon flex items-center justify-center text-white text-[9px] font-black flex-shrink-0">
                      {userEmail[0].toUpperCase()}
                    </div>
                    <span className="truncate max-w-[180px]">{userEmail}</span>
                  </Link>
                ) : (
                  <Link href="/login" className="btn-secondary text-center">
                    Connexion
                  </Link>
                )}
                <Link href="/upload" className="btn-primary text-center">
                  Générer maintenant
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
