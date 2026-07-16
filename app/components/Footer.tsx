import Link from "next/link";
import { Instagram, AlertTriangle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo2.png" alt="AstraCrea" className="h-11 w-auto rounded-xl" />
              <span className="font-black text-lg tracking-tight">Astra<span className="gradient-text">Crea</span></span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              La plateforme de transformation photo par IA Ultra HD la plus avancée.
              Résultats 4K en quelques secondes.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a href="https://instagram.com/aleksisgn" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-surface border border-surface-border rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:border-accent-violet/50 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white/80">Produit</h4>
            <ul className="space-y-2">
              {[
                { href: "/upload", label: "Générer" },
                { href: "/pricing", label: "Tarifs" },
                { href: "/dashboard", label: "Dashboard" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/50 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white/80">Légal</h4>
            <ul className="space-y-2">
              {[
                { href: "/terms", label: "CGU" },
                { href: "/privacy", label: "Confidentialité" },
                { href: "/consent", label: "Consentement" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/50 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Disclaimer légal ── */}
        <div className="mt-12 rounded-2xl border border-white/8 bg-white/[0.03] px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-white/35" />
            </div>
            <div className="space-y-2">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                Avertissement — Limitation de responsabilité
              </p>
              <p className="text-white/38 text-xs leading-relaxed">
                AstraCrea est un outil de divertissement basé sur l&apos;intelligence artificielle.
                Les images générées via notre plateforme sont destinées à un usage strictement personnel et récréatif.
                <strong className="text-white/55 font-semibold"> AstraCrea ne saurait être tenu responsable, sous quelque prétexte que ce soit, des actions, usages ou diffusions réalisés par ses utilisateurs à la suite des générations effectuées sur la plateforme.</strong>{" "}
                Toute utilisation à des fins illégales, diffamatoires, commerciales non autorisées, ou portant atteinte aux droits d&apos;un tiers engage la seule et entière responsabilité de l&apos;utilisateur.
                L&apos;utilisation de notre service vaut acceptation explicite de ces conditions.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-surface-border mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            © 2025 AstraCrea. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-white/30 hover:text-white text-xs transition-colors">
              Contact
            </Link>
            <p className="text-white/20 text-xs">
              Usage créatif uniquement. Respect des droits à l&apos;image requis.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
