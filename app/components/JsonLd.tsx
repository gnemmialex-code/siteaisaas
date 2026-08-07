/**
 * Injecte un bloc de données structurées dans le HTML rendu par le serveur.
 *
 * Composant serveur volontairement : le balisage doit être présent dans le
 * HTML initial, pas ajouté après hydratation.
 *
 * `data` accepte un objet ou un tableau d'objets. Un tableau est sérialisé en
 * `@graph`, ce qui permet aux nœuds de se référencer entre eux par `@id`
 * (l'Organization sert par exemple d'éditeur au WebSite).
 */
export default function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  const payload = Array.isArray(data)
    ? { "@context": "https://schema.org", "@graph": data }
    : { "@context": "https://schema.org", ...data };

  return (
    <script
      type="application/ld+json"
      // `<` est échappé pour qu'une chaîne contenant « </script> » ne puisse
      // pas refermer la balise prématurément.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
      }}
    />
  );
}
