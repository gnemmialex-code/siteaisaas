import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import JsonLd from "../components/JsonLd";
import { formatDate, getPublishedPosts } from "@/lib/blog";
import { blogSchema, breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/blog",
  title: "Le blog AstraCrea — essayage virtuel et photo par IA",
  description:
    "Guides et analyses sur l'essayage virtuel de montres par intelligence artificielle : qualité de rendu, préparation des photos, limites de la technologie.",
});

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <JsonLd
        data={[breadcrumbSchema({ name: "Blog", path: "/blog" }), blogSchema(posts)]}
      />

      <section className="px-4 sm:px-6 pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-black mb-3">
            Le <span className="gradient-text">blog</span>
          </h1>
          <p className="text-white/50 text-sm sm:text-lg mb-10 sm:mb-14">
            Ce que fait vraiment l&apos;essayage virtuel par IA : méthode, qualité de rendu et limites.
          </p>

          {posts.length === 0 ? (
            /* Aucun article publié : on le dit franchement plutôt que d'afficher
               une grille vide. Rien n'est généré automatiquement pour meubler. */
            <div className="card border-surface-border">
              <h2 className="text-lg font-semibold text-white mb-2">Aucun article publié pour le moment</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Les premiers articles arrivent. En attendant, la{" "}
                <Link href="/#faq" className="text-accent-violet hover:underline">
                  foire aux questions
                </Link>{" "}
                et la page{" "}
                <Link href="/pricing" className="text-accent-violet hover:underline">
                  tarifs
                </Link>{" "}
                répondent à l&apos;essentiel.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block card border-surface-border hover:border-accent-violet/50 transition-colors group"
                  >
                    <article>
                      <h2 className="text-lg sm:text-xl font-semibold text-white group-hover:text-accent-violet transition-colors mb-1.5">
                        {post.title}
                      </h2>
                      <p className="text-white/55 text-sm leading-relaxed mb-3">{post.description}</p>
                      <time dateTime={post.publishedAt} className="text-white/35 text-xs">
                        {formatDate(post.publishedAt)}
                      </time>
                    </article>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
