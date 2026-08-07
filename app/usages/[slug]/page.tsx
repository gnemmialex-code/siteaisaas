import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingSkeleton from "../../components/LandingSkeleton";
import { getLandingPage, getLandingPages, landingPath } from "@/lib/landing";
import { pageMetadata } from "@/lib/seo";

const BASE = "/usages";
const SECTION_NAME = "Cas d'usage";

export function generateStaticParams() {
  return getLandingPages(BASE).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getLandingPage(BASE, slug);
  if (!page) return {};

  return pageMetadata({
    path: landingPath(page),
    title: page.title,
    description: page.description,
    // Un squelette sans corps de texte ne doit pas être indexé : une page
    // vide qui entre dans l'index coûte plus qu'elle ne rapporte.
    noIndex: page.draft,
  });
}

export default async function UsagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getLandingPage(BASE, slug);
  if (!page) notFound();

  return <LandingSkeleton page={page} sectionName={SECTION_NAME} />;
}
