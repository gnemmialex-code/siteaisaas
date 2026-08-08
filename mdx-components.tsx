import type { MDXComponents } from "mdx/types";
import Image, { type ImageProps } from "next/image";
import Link from "next/link";

/**
 * Rendu des éléments Markdown des articles.
 *
 * Les styles reprennent la charte existante (fond #0D0D0D, accent violet,
 * texte blanc atténué) plutôt que d'introduire une feuille de style à part :
 * un article doit avoir l'air d'appartenir au site.
 *
 * Le h1 n'est volontairement pas stylé ici — il est rendu par le gabarit
 * d'article à partir du titre déclaré, pour qu'un fichier .mdx ne puisse pas
 * introduire un second h1 dans la page.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: (props) => (
      <h2 className="text-2xl sm:text-3xl font-bold text-white mt-10 mb-3 scroll-mt-24" {...props} />
    ),
    h3: (props) => (
      <h3 className="text-lg sm:text-xl font-semibold text-white mt-7 mb-2 scroll-mt-24" {...props} />
    ),
    p: (props) => <p className="text-white/70 leading-relaxed mb-4" {...props} />,
    ul: (props) => <ul className="list-disc pl-5 space-y-1.5 text-white/70 mb-4" {...props} />,
    ol: (props) => <ol className="list-decimal pl-5 space-y-1.5 text-white/70 mb-4" {...props} />,
    li: (props) => <li className="leading-relaxed" {...props} />,
    strong: (props) => <strong className="text-white font-semibold" {...props} />,
    blockquote: (props) => (
      <blockquote
        className="border-l-2 border-accent-violet/60 pl-4 my-6 text-white/60 italic"
        {...props}
      />
    ),
    hr: () => <hr className="border-surface-border my-10" />,
    code: (props) => (
      <code className="font-mono text-[0.9em] text-accent-neon bg-surface px-1.5 py-0.5 rounded" {...props} />
    ),
    pre: (props) => (
      <pre
        className="bg-surface border border-surface-border rounded-xl p-4 overflow-x-auto my-6 text-sm"
        {...props}
      />
    ),
    table: (props) => (
      <div className="overflow-x-auto my-6">
        <table className="w-full text-sm text-left border-collapse" {...props} />
      </div>
    ),
    th: (props) => (
      <th className="border-b border-surface-border py-2 pr-4 text-white font-semibold" {...props} />
    ),
    td: (props) => <td className="border-b border-surface-border/60 py-2 pr-4 text-white/70" {...props} />,

    // Les liens internes passent par next/link ; les externes sortent en
    // nouvel onglet avec les attributs de sécurité qui vont avec.
    a: ({ href = "", children, ...rest }) => {
      const isInternal = href.startsWith("/") || href.startsWith("#");
      const className = "text-accent-violet hover:underline underline-offset-2";
      return isInternal ? (
        <Link href={href} className={className} {...rest}>
          {children}
        </Link>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
          {children}
        </a>
      );
    },

    /**
     * Une image d'article doit toujours déclarer ses dimensions (CLS) et un
     * texte alternatif.
     *
     * L'`alt` vient du Markdown : `![texte](image.png)`. Un auteur qui écrit
     * `![](image.png)` produirait une image annoncée comme décorative et
     * invisible pour Google Images — sur un blog écrit pour le référencement,
     * c'est une perte silencieuse. On avertit donc en développement plutôt que
     * de laisser passer. En production on n'échoue pas le rendu pour autant :
     * `alt=""` reste un repli valide côté accessibilité.
     */
    img: (props) => {
      const { alt, ...rest } = props as ImageProps;

      if (process.env.NODE_ENV !== "production" && !alt) {
        console.warn(
          `[mdx] Image sans texte alternatif : ${String(rest.src)} — ` +
            "écris ![description de l'image](chemin) dans le .mdx.",
        );
      }

      return (
        <Image
          sizes="(max-width: 768px) 100vw, 768px"
          className="rounded-xl border border-surface-border my-6 w-full h-auto"
          alt={alt ?? ""}
          {...rest}
        />
      );
    },

    ...components,
  };
}
