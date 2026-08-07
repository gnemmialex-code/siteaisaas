import Link from "next/link";
import Navbar from "./Navbar";
import Footer from "./Footer";
import JsonLd from "./JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { landingPath, type LandingPage } from "@/lib/landing";

/**
 * Gabarit commun aux pages d'atterrissage thématiques.
 *
 * Il pose la structure — h1 unique, sections h2, bloc FAQ, appel à l'action —
 * et laisse les corps de texte vides. Les encarts de consigne ne sont rendus
 * QUE tant que la page est en brouillon : une fois `draft` passé à false, il
 * ne reste que le contenu réel.
 *
 * Le JSON-LD FAQPage n'est pas émis ici : les réponses ne sont pas écrites, et
 * baliser des questions sans réponse serait un balisage vide. Il faudra
 * l'ajouter en même temps que les réponses.
 */
export default function LandingSkeleton({
  page,
  sectionName,
}: {
  page: LandingPage;
  /** Libellé de la rubrique dans le fil d'Ariane (« Cas d'usage », etc.). */
  sectionName: string;
}) {
  const path = landingPath(page);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {!page.draft && (
        <JsonLd
          data={breadcrumbSchema(
            { name: sectionName, path: page.base },
            { name: page.label, path },
          )}
        />
      )}

      <section className="px-4 sm:px-6 pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div className="max-w-2xl mx-auto">
          {page.draft && (
            <p className="mb-8 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-xs text-yellow-300/80">
              Squelette — page en <code>noindex</code> et absente du sitemap. Les corps de
              texte sont à écrire dans <code>lib/landing.ts</code>, puis passez{" "}
              <code>draft: false</code>.
            </p>
          )}

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
            {page.h1}
          </h1>
          <p className="text-white/55 text-base sm:text-lg leading-relaxed mb-12">{page.intro}</p>

          {page.sections.map((section) => (
            <section key={section.heading} className="mb-10">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">{section.heading}</h2>
              {page.draft ? (
                <p className="rounded-lg border border-dashed border-surface-border px-4 py-3 text-xs text-white/35 leading-relaxed">
                  À rédiger — {section.brief}
                </p>
              ) : null}
            </section>
          ))}

          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Questions fréquentes</h2>
            <ul className="space-y-3">
              {page.faq.map((question) => (
                <li key={question} className="border border-surface-border rounded-xl px-4 py-3">
                  <h3 className="text-sm font-semibold text-white/80">{question}</h3>
                  {page.draft ? (
                    <p className="text-xs text-white/30 mt-1.5">Réponse à rédiger.</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          <div className="card border-accent-violet/25 bg-accent-violet/5">
            <h2 className="text-lg font-bold text-white mb-2">Essayer AstraCrea</h2>
            <p className="text-white/55 text-sm leading-relaxed mb-4">
              Créez un compte gratuit et générez un premier aperçu, sans carte bancaire.
            </p>
            <Link href="/register" className="btn-primary inline-flex items-center gap-2 text-sm">
              Créer mon compte
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
