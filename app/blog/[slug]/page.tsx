import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import JsonLd from "../../components/JsonLd";
import { allSlugs, formatDate, getPost } from "@/lib/blog";
import { articleSchema, breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

/** Tous les articles, brouillons compris : une URL de brouillon reste
 *  consultable pour relecture, mais elle est en noindex et hors sitemap. */
export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  return {
    ...pageMetadata({
      path: `/blog/${slug}`,
      title: post.meta.title,
      description: post.meta.description,
      noIndex: post.meta.draft,
    }),
    openGraph: {
      type: "article",
      locale: "fr_FR",
      siteName: "AstraCrea",
      url: `/blog/${slug}`,
      title: post.meta.title,
      description: post.meta.description,
      publishedTime: post.meta.publishedAt,
      modifiedTime: post.meta.updatedAt ?? post.meta.publishedAt,
      ...(post.meta.author ? { authors: [post.meta.author] } : {}),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const { meta, Content } = post;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Le JSON-LD Article n'est émis que pour un article publié : baliser un
          brouillon reviendrait à déclarer comme publié quelque chose qui ne
          l'est pas. */}
      {!meta.draft && (
        <JsonLd
          data={[
            breadcrumbSchema(
              { name: "Blog", path: "/blog" },
              { name: meta.title, path: `/blog/${slug}` },
            ),
            articleSchema(meta),
          ]}
        />
      )}

      <article className="px-4 sm:px-6 pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div className="max-w-2xl mx-auto">
          <nav aria-label="Fil d'Ariane" className="mb-6 text-xs text-white/35">
            <Link href="/blog" className="hover:text-white/70 transition-colors">
              Blog
            </Link>
          </nav>

          {meta.draft && (
            <p className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-xs text-yellow-300/80">
              Brouillon — cette page est en <code>noindex</code> et absente du sitemap.
              Passez <code>draft: false</code> dans le fichier .mdx pour la publier.
            </p>
          )}

          {/* Unique h1 de la page, rendu ici et non dans le .mdx : un fichier
              d'article ne peut donc pas en introduire un second. */}
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3">
            {meta.title}
          </h1>
          <p className="text-white/50 text-base sm:text-lg leading-relaxed mb-5">{meta.description}</p>

          <div className="flex items-center gap-2 text-xs text-white/35 mb-10 pb-8 border-b border-surface-border">
            <time dateTime={meta.publishedAt}>{formatDate(meta.publishedAt)}</time>
            {meta.updatedAt && meta.updatedAt !== meta.publishedAt && (
              <>
                <span aria-hidden>·</span>
                <span>Mis à jour le {formatDate(meta.updatedAt)}</span>
              </>
            )}
            {meta.author && (
              <>
                <span aria-hidden>·</span>
                <span>{meta.author}</span>
              </>
            )}
          </div>

          <Content />

          <div className="mt-14 pt-8 border-t border-surface-border">
            <Link href="/blog" className="text-accent-violet hover:underline text-sm">
              ← Tous les articles
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
