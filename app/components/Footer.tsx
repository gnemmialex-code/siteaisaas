import Image from "next/image";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {/* Téléphone : 2 colonnes (Produit / Légal côte à côte sous la marque) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 sm:gap-10">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-2 sm:mb-4">
              {/* next/image : même fichier de 206 Ko que dans la barre de
                  navigation, ici pour un rendu de 32 à 44 px. Chargement
                  différé — le pied de page est toujours sous la ligne de
                  flottaison. */}
              {/* alt vide : le nom « AstraCrea » suit immédiatement dans le
                  même lien, le répéter n'apporte rien à un lecteur d'écran. */}
              <Image
                src="/logo2.png"
                alt=""
                width={44}
                height={44}
                loading="lazy"
                className="h-8 sm:h-11 w-auto rounded-lg sm:rounded-xl"
              />
              <span className="font-black text-base sm:text-lg tracking-tight">Astra<span className="gradient-text">Crea</span></span>
            </Link>
            <p className="text-white/50 text-[11px] sm:text-sm leading-relaxed max-w-xs">
              La plateforme de transformation photo par IA Ultra HD la plus avancée.
              Résultats 4K en quelques secondes.
            </p>
          </div>

          {/* Links */}
          <div>
            {/* h3 et non h4 : le dernier niveau utilisé au-dessus dans les pages
                est h2, un h4 créerait un saut de niveau. Style inchangé. */}
            <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-4 text-white/80">Produit</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {[
                { href: "/upload", label: "Générer" },
                { href: "/pricing", label: "Tarifs" },
                { href: "/dashboard", label: "Dashboard" },
                // Lien interne visible depuis la page d'accueil vers la surface
                // de contenu. Ajouté dans la colonne existante plutôt qu'en
                // créant une quatrième colonne, qui casserait la grille.
                { href: "/blog", label: "Blog" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/50 hover:text-white text-xs sm:text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-4 text-white/80">Légal</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {[
                { href: "/terms", label: "CGU" },
                { href: "/privacy", label: "Confidentialité" },
                { href: "/consent", label: "Consentement" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/50 hover:text-white text-xs sm:text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Disclaimer légal ── */}
        <div className="mt-6 sm:mt-12 rounded-xl sm:rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3.5 sm:px-6 sm:py-5">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/35" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <p className="text-white/60 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">
                Avertissement — Limitation de responsabilité
              </p>
              <p className="text-white/38 text-[10px] sm:text-xs leading-relaxed">
                AstraCrea est un outil de divertissement basé sur l&apos;intelligence artificielle.
                Les images générées via notre plateforme sont destinées à un usage strictement personnel et récréatif.
                <strong className="text-white/55 font-semibold"> AstraCrea ne saurait être tenu responsable, sous quelque prétexte que ce soit, des actions, usages ou diffusions réalisés par ses utilisateurs à la suite des générations effectuées sur la plateforme.</strong>{" "}
                Toute utilisation à des fins illégales, diffamatoires, commerciales non autorisées, ou portant atteinte aux droits d&apos;un tiers engage la seule et entière responsabilité de l&apos;utilisateur.
                L&apos;utilisation de notre service vaut acceptation explicite de ces conditions.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-surface-border mt-4 pt-4 sm:mt-6 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          <p className="text-white/30 text-[11px] sm:text-sm">
            © 2025 AstraCrea. Tous droits réservés.
          </p>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/contact" className="text-white/30 hover:text-white text-[10px] sm:text-xs transition-colors">
              Contact
            </Link>
            <p className="text-white/20 text-[10px] sm:text-xs text-center sm:text-left">
              Usage créatif uniquement. Respect des droits à l&apos;image requis.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
