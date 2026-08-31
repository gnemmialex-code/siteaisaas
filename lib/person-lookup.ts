// Recherche en ligne du nom demandé, avant la génération.
//
// Pourquoi : le modèle d'image (nano-banana-pro / Seedance) ne navigue pas sur
// le web. Si l'utilisateur demande une personne peu connue, absente de
// CELEBRITY_DB, le modèle invente un visage générique. Ce module va donc
// chercher la personne EN LIGNE côté serveur, avant l'appel au modèle, et lui
// fournit de vraies photos de référence + une description vérifiée.
//
// Chaîne de résolution :
//
//   1. Wikidata `wbsearchentities`  — recherche par NOM (et alias), pas par
//      texte d'article : « Léna Situations » retrouve bien Léna Mahfouf.
//   2. Filtre « être humain » (P31 = Q5) + contrôle strict de correspondance
//      du nom. En cas de doute on ne renvoie RIEN plutôt que la mauvaise
//      personne : une erreur d'identité est pire qu'une absence de référence.
//   3. Wikipédia (fr puis en) via sitelinks — résumé + photo principale.
//   4. Wikimedia Commons — photos supplémentaires, prises dans la catégorie
//      Commons officielle de la personne (P373) pour éviter les homonymes.
//   5. Claude + recherche web (optionnel, si ANTHROPIC_API_KEY est défini) —
//      description physique détaillée rédigée à partir de sources récentes.
//
// Les étapes 1 à 4 ne demandent aucune clé API et fonctionnent toujours.
// Tout échec est silencieux : on dégrade, on ne casse jamais la génération.

import Anthropic from "@anthropic-ai/sdk";

export type PersonProfile = {
  /** Nom tel que tapé par l'utilisateur */
  query: string;
  /** Nom canonique trouvé en ligne */
  name: string;
  /** Description d'apparence à injecter dans le prompt */
  description: string;
  /** Photos de référence réelles (URLs publiques) */
  imageUrls: string[];
  /** Pages sources consultées */
  sources: string[];
  /** Couches ayant réellement répondu */
  via: string[];
  confidence: "high" | "medium" | "low";
};

const WIKI_LANGS   = ["fr", "en"] as const;
const MAX_IMAGES   = 4;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h
const CACHE_MAX    = 300;

// Score minimum de correspondance de nom pour accepter une identité.
// En dessous, on refuse : mieux vaut aucune référence qu'une autre personne.
const MIN_NAME_SCORE = 80;

// Wikimedia exige un User-Agent descriptif avec un moyen de contact, sous peine
// de limitation agressive. Renseigner WIKIMEDIA_CONTACT (email ou URL du site).
const UA =
  `CelebSwap/1.0 (generation reference lookup; ` +
  `${process.env.WIKIMEDIA_CONTACT ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://celebswap.app"})`;

// ─── Cache mémoire (par instance serverless) ────────────────────────────────

type CacheEntry = { at: number; value: PersonProfile | null };
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): CacheEntry | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return hit;
}

function cacheSet(key: string, value: PersonProfile | null): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), value });
}

// ─── Utilitaires ────────────────────────────────────────────────────────────

/**
 * GET JSON avec une reprise courte sur limitation de debit.
 * Les API Wikimedia repondent 429 quand le trafic anonyme est trop dense :
 * sans reprise, la personne demandee serait declaree introuvable a tort.
 */
async function getJson<T>(url: string, timeoutMs: number, retries = 2): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.status === 429 || res.status === 503) {
        if (attempt === retries) {
          console.warn(`[PersonLookup] Wikimedia a limite la requete (${res.status}) : ${url.slice(0, 90)}`);
          return null;
        }
        const retryAfter = Number(res.headers.get("retry-after"));
        const waitMs = Math.min(
          Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 600 * (attempt + 1),
          2000,
        );
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }
  return null;
}

/** minuscule, sans accents, sans ponctuation — pour comparer des noms. */
export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  return normalizeName(s).split(" ").filter(Boolean);
}

/**
 * Score de correspondance entre le nom demandé et les noms connus d'une entité
 * (libellé + alias). 100 = identique, 80 = le nom demandé est entièrement
 * contenu dans le nom officiel, 0 = incompatible.
 *
 * C'est ce contrôle qui empêche « cristiano ronaldo » de tomber sur « Ronaldo »
 * (le Brésilien) : les jetons demandés ne sont pas tous dans le libellé.
 */
function nameScore(query: string, candidateNames: string[]): number {
  const q  = normalizeName(query);
  const qt = tokens(query);
  if (qt.length === 0) return 0;

  let best = 0;
  for (const candidate of candidateNames) {
    if (!candidate) continue;
    const c  = normalizeName(candidate);
    const ct = tokens(candidate);
    if (!c) continue;

    if (c === q) return 100;

    // Un nom d'un seul mot doit correspondre exactement : « Léna » ne doit pas
    // ramener la première Léna venue.
    if (qt.length === 1) continue;

    // Tous les mots demandés figurent dans le nom officiel.
    if (qt.every((t) => ct.includes(t))) best = Math.max(best, 80);
  }
  return best;
}

// ─── Extraction des noms candidats dans le prompt ───────────────────────────
//
// L'utilisateur écrit rarement proprement : « ajoute cristiano ronaldo a coté
// de moi », « mets moi avec Léna Situations »… On extrait large (déclencheurs
// + séquences capitalisées) et c'est Wikidata + le score de nom qui tranchent.

const TRIGGER_RE =
  /(?:avec|aux?\s+c[ôo]t[ée]s?\s+de|[àa]\s*c[ôo]t[ée]\s+de|pr[èe]s\s+de|ajoute[rz]?|rajoute[rz]?|next\s+to|beside|alongside|together\s+with|with|add)\s+/giu;

const CAPITALIZED_RE =
  /\p{Lu}[\p{L}'’\-]+(?:\s+\p{Lu}[\p{L}'’\-]+){0,3}/gu;

// Mots de liaison à rogner en début / fin de candidat.
const FUNCTION_WORDS = new Set([
  "a", "à", "au", "aux", "de", "du", "des", "le", "la", "les", "l", "un", "une",
  "et", "ou", "en", "sur", "sous", "dans", "pour", "par", "avec", "sans", "chez",
  "cote", "côté", "cotes", "côtés", "pres", "près", "the", "of", "and", "with",
  "on", "in", "at", "to", "my", "me", "moi", "nous", "us", "toi", "him", "her",
]);

// Mots à ne jamais traiter comme un nom de personne (décor, style, technique).
const STOPWORDS = new Set([
  "moi", "nous", "toi", "lui", "elle", "eux", "je", "tu", "il", "on", "me", "us",
  "photo", "image", "scene", "scène", "fond", "background", "decor", "décor",
  "plage", "mer", "ocean", "océan", "ville", "city", "foret", "forêt", "montagne",
  "studio", "bureau", "villa", "voiture", "maison", "piscine", "jardin", "rue",
  "soleil", "coucher", "lumiere", "lumière", "nuit", "jour", "hiver", "ete", "été",
  "style", "rendu", "qualite", "qualité", "hd", "4k", "8k", "ultra", "pro", "elite",
  "portrait", "selfie", "cinema", "cinéma", "cinematique", "cinématique",
  "noir", "blanc", "couleur", "sepia", "sépia", "vintage", "retro", "rétro",
  "costume", "smoking", "robe", "tenue", "veste", "chemise", "jean", "sneakers",
  "montre", "rolex", "bijou", "collier", "lunettes", "casquette", "chapeau",
  "homme", "femme", "personne", "gars", "mec", "fille", "ami", "amie", "someone",
  "person", "man", "woman", "guy", "girl", "friend", "celebrity", "celebrite",
]);

function trimCandidate(raw: string): string {
  let words = raw
    .replace(/[.,;:!?«»"()\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  const isNoise = (w: string) => {
    const n = normalizeName(w);
    return !n || FUNCTION_WORDS.has(n) || STOPWORDS.has(n);
  };

  while (words.length && isNoise(words[0]))                words = words.slice(1);
  while (words.length && isNoise(words[words.length - 1])) words = words.slice(0, -1);

  return words.join(" ");
}

function isPlausibleName(candidate: string): boolean {
  const words = candidate.split(" ").filter(Boolean);
  if (words.length === 0 || words.length > 4) return false;
  if (candidate.length < 3 || candidate.length > 60) return false;
  if (words.every((w) => STOPWORDS.has(normalizeName(w)))) return false;
  return /\p{L}/u.test(candidate);
}

/** Noms de personnes potentiellement demandés dans le prompt (ordre de priorité). */
export function extractPersonNames(text: string, max = 4): string[] {
  if (!text?.trim()) return [];

  const found: string[] = [];
  const seen  = new Set<string>();

  const push = (raw: string) => {
    const c = trimCandidate(raw);
    if (!isPlausibleName(c)) return;
    const key = normalizeName(c);
    if (!key || seen.has(key)) return;
    seen.add(key);
    found.push(c);
  };

  // 1. Après un déclencheur explicite ("avec X", "ajoute X", "next to X")
  TRIGGER_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TRIGGER_RE.exec(text)) !== null) {
    const rest    = text.slice(m.index + m[0].length);
    const segment = rest.split(/[,.;:!?]|\bet\b|\band\b|\bdans\b|\bsur\b|\bau\b/iu)[0] ?? "";
    const words   = segment.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    // Groupe le plus long d'abord (prénom + nom), puis plus court.
    for (let n = Math.min(4, words.length); n >= 1; n--) {
      push(words.slice(0, n).join(" "));
    }
  }

  // 2. Séquences capitalisées (« Léna Situations », « Kylian Mbappé »)
  for (const c of text.match(CAPITALIZED_RE) ?? []) push(c);

  // Les candidats multi-mots passent en premier : plus spécifiques, moins
  // d'ambiguïté qu'un prénom seul.
  found.sort((a, b) => b.split(" ").length - a.split(" ").length);
  return found.slice(0, max);
}

// ─── Wikidata ───────────────────────────────────────────────────────────────

type WbSearchResponse = { search?: { id: string }[] };

async function searchWikidata(name: string, lang: string): Promise<string[]> {
  const url =
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&origin=*` +
    `&search=${encodeURIComponent(name)}&language=${lang}&uselang=${lang}` +
    `&type=item&limit=10`;
  const data = await getJson<WbSearchResponse>(url, 6000);
  return (data?.search ?? []).map((r) => r.id);
}

type WikidataClaim = { mainsnak?: { datavalue?: { value?: unknown } } };

type WikidataEntity = {
  id?:           string;
  labels?:       Record<string, { value: string }>;
  aliases?:      Record<string, { value: string }[]>;
  descriptions?: Record<string, { value: string }>;
  claims?:       Record<string, WikidataClaim[]>;
  sitelinks?:    Record<string, { title: string }>;
};

type WikidataResponse = { entities?: Record<string, WikidataEntity> };

function claimIds(entity: WikidataEntity, prop: string): string[] {
  const out: string[] = [];
  for (const c of entity.claims?.[prop] ?? []) {
    const v = c.mainsnak?.datavalue?.value as { id?: string } | undefined;
    if (v?.id) out.push(v.id);
  }
  return out;
}

function claimStrings(entity: WikidataEntity, prop: string): string[] {
  const out: string[] = [];
  for (const c of entity.claims?.[prop] ?? []) {
    const v = c.mainsnak?.datavalue?.value;
    if (typeof v === "string") out.push(v);
  }
  return out;
}

function claimTime(entity: WikidataEntity, prop: string): string | null {
  for (const c of entity.claims?.[prop] ?? []) {
    const v = c.mainsnak?.datavalue?.value as { time?: string } | undefined;
    if (v?.time) return v.time;
  }
  return null;
}

function claimQuantity(entity: WikidataEntity, prop: string): number | null {
  for (const c of entity.claims?.[prop] ?? []) {
    const v = c.mainsnak?.datavalue?.value as { amount?: string } | undefined;
    if (v?.amount) {
      const n = Number(v.amount);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

// Depuis 2024, Wikidata range les noms propres sous la langue « mul »
// (multilingue) au lieu de les dupliquer par langue : sans elle, le libelle de
// nombreuses personnes revient vide et l'identite est rejetee a tort.
const LABEL_LANGS = ["mul", "fr", "en"] as const;

function entityNames(entity: WikidataEntity): string[] {
  const names: string[] = [];
  for (const lang of LABEL_LANGS) {
    const label = entity.labels?.[lang]?.value;
    if (label) names.push(label);
    for (const alias of entity.aliases?.[lang] ?? []) names.push(alias.value);
  }
  return names;
}

async function fetchEntities(ids: string[]): Promise<Record<string, WikidataEntity>> {
  if (ids.length === 0) return {};
  const url =
    `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*` +
    `&ids=${ids.slice(0, 50).join("|")}` +
    `&props=labels|aliases|descriptions|claims|sitelinks&languages=mul|fr|en&sitefilter=frwiki|enwiki`;
  const data = await getJson<WikidataResponse>(url, 8000);
  return data?.entities ?? {};
}

async function fetchLabels(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const url =
    `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*` +
    `&ids=${ids.slice(0, 50).join("|")}&props=labels&languages=en|fr|mul`;
  const data = await getJson<WikidataResponse>(url, 6000);
  const out: Record<string, string> = {};
  for (const [id, ent] of Object.entries(data?.entities ?? {})) {
    const label = ent.labels?.en?.value ?? ent.labels?.fr?.value ?? ent.labels?.mul?.value;
    if (label) out[id] = label;
  }
  return out;
}

// ─── Wikipédia ──────────────────────────────────────────────────────────────

type WikiPage = { title: string; extract?: string; original?: { source: string } };
type WikiResponse = { query?: { pages?: Record<string, WikiPage> } };

async function fetchWikipediaPage(lang: string, title: string): Promise<WikiPage | null> {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
    `&titles=${encodeURIComponent(title)}&prop=extracts|pageimages` +
    `&exintro=1&explaintext=1&exsentences=6&piprop=original`;
  const data = await getJson<WikiResponse>(url, 6000);
  const pages = Object.values(data?.query?.pages ?? {});
  return pages[0] ?? null;
}

// ─── Wikimedia Commons ──────────────────────────────────────────────────────

const BAD_IMAGE_RE =
  /signature|logo|coat[_ ]of[_ ]arms|flag|map|icon|symbol|autograph|stamp|plaque|award|trophy|diagram|chart|\.svg$|\.ogv$|\.webm$|\.pdf$/i;

type CommonsImage = { title: string; imageinfo?: { url: string; mime: string; width: number }[] };
type CommonsResponse = { query?: { pages?: Record<string, CommonsImage> } };

function usableCommonsUrls(data: CommonsResponse | null, limit: number): string[] {
  const urls: string[] = [];
  for (const page of Object.values(data?.query?.pages ?? {})) {
    if (BAD_IMAGE_RE.test(page.title)) continue;
    const info = page.imageinfo?.[0];
    if (!info) continue;
    if (!/^image\/(jpeg|png|webp)$/i.test(info.mime)) continue;
    if (info.width < 400) continue;
    urls.push(info.url);
    if (urls.length >= limit) break;
  }
  return urls;
}

/** Photos issues de la catégorie Commons officielle de la personne (P373). */
async function commonsCategoryPhotos(category: string, limit: number): Promise<string[]> {
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*` +
    `&generator=categorymembers&gcmtitle=${encodeURIComponent(`Category:${category}`)}` +
    `&gcmtype=file&gcmlimit=${Math.max(limit * 4, 12)}` +
    `&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1200`;
  return usableCommonsUrls(await getJson<CommonsResponse>(url, 6000), limit);
}

function commonsFileUrl(filename: string, width = 1200): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`;
}

// ─── Résolution encyclopédique ──────────────────────────────────────────────

type Candidate = { entity: WikidataEntity; qid: string; score: number };

async function lookupEncyclopedia(name: string): Promise<PersonProfile | null> {
  // 1. Chercher des entités par NOM (fr puis en), pas par texte d'article.
  // Le francais suffit dans la grande majorite des cas : on n'interroge l'anglais
  // que si la premiere recherche ne rend presque rien (economie de requetes, le
  // trafic anonyme Wikimedia etant limite).
  const qids = new Set<string>();
  for (const lang of WIKI_LANGS) {
    for (const id of await searchWikidata(name, lang)) qids.add(id);
    if (qids.size >= 5) break;
  }
  if (qids.size === 0) return null;

  const entities = await fetchEntities([...qids]);

  // 2. Garder les êtres humains dont le nom correspond réellement.
  const candidates: Candidate[] = [];
  for (const [qid, entity] of Object.entries(entities)) {
    if (!claimIds(entity, "P31").includes("Q5")) continue; // pas un humain
    const score = nameScore(name, entityNames(entity));
    if (score < MIN_NAME_SCORE) continue;
    candidates.push({ entity, qid, score });
  }
  if (candidates.length === 0) return null;

  // 3. Meilleur score ; à égalité, l'entité la mieux documentée.
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aDoc = Object.keys(a.entity.claims ?? {}).length;
    const bDoc = Object.keys(b.entity.claims ?? {}).length;
    return bDoc - aDoc;
  });

  // Ambiguïté réelle : deux homonymes également plausibles → on s'abstient
  // plutôt que de risquer la mauvaise personne.
  if (
    candidates.length > 1 &&
    candidates[0].score === candidates[1].score &&
    candidates[0].score < 100
  ) {
    console.warn(`[PersonLookup] "${name}" ambigu (${candidates.length} homonymes) — abandon`);
    return null;
  }

  const { entity, qid } = candidates[0];

  // 4. Attributs structurés.
  const genderIds     = claimIds(entity, "P21");
  const occupationIds = claimIds(entity, "P106").slice(0, 4);
  const countryIds    = claimIds(entity, "P27").slice(0, 2);
  const eyeIds        = claimIds(entity, "P1340").slice(0, 1);
  const hairIds       = claimIds(entity, "P1884").slice(0, 1);
  const heightCm      = claimQuantity(entity, "P2048");
  const birth         = claimTime(entity, "P569");
  const imageFiles    = claimStrings(entity, "P18");
  const commonsCat    = claimStrings(entity, "P373")[0];

  const labels = await fetchLabels([
    ...genderIds, ...occupationIds, ...countryIds, ...eyeIds, ...hairIds,
  ]);

  const gender = genderIds.map((id) => labels[id]).filter(Boolean).join(", ");
  const jobs   = occupationIds.map((id) => labels[id]).filter(Boolean).join(", ");
  const from   = countryIds.map((id) => labels[id]).filter(Boolean).join(", ");
  const eyes   = eyeIds.map((id) => labels[id]).filter(Boolean).join(", ");
  const hair   = hairIds.map((id) => labels[id]).filter(Boolean).join(", ");

  let age: number | null = null;
  if (birth) {
    const year = Number(birth.slice(1, 5));
    if (Number.isFinite(year) && year > 1900) age = new Date().getFullYear() - year;
  }

  const canonicalName =
    entity.labels?.mul?.value ?? entity.labels?.fr?.value ?? entity.labels?.en?.value ?? name;

  // 5. Page Wikipédia liée (résumé + photo d'en-tête).
  const sources: string[] = [`https://www.wikidata.org/wiki/${qid}`];
  let summary = "";
  let leadImage: string | undefined;

  for (const lang of WIKI_LANGS) {
    const title = entity.sitelinks?.[`${lang}wiki`]?.title;
    if (!title) continue;
    const page = await fetchWikipediaPage(lang, title);
    if (!page) continue;
    sources.unshift(`https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`);
    if (!summary && page.extract) summary = page.extract.replace(/\s+/g, " ").trim().slice(0, 700);
    if (!leadImage && page.original?.source) leadImage = page.original.source;
    if (summary && leadImage) break;
  }

  // 6. Photos : P18 (officielle) → photo d'en-tête → catégorie Commons.
  const imageUrls: string[] = [];
  for (const f of imageFiles) {
    if (!BAD_IMAGE_RE.test(f)) imageUrls.push(commonsFileUrl(f));
  }
  if (leadImage && !imageUrls.includes(leadImage)) imageUrls.push(leadImage);
  if (imageUrls.length < MAX_IMAGES && commonsCat) {
    for (const u of await commonsCategoryPhotos(commonsCat, MAX_IMAGES - imageUrls.length)) {
      if (!imageUrls.includes(u)) imageUrls.push(u);
    }
  }

  // 7. Description.
  const facts: string[] = [];
  if (jobs)     facts.push(jobs);
  if (from)     facts.push(`from ${from}`);
  if (gender)   facts.push(gender);
  if (age)      facts.push(`approximately ${age} years old today`);
  if (heightCm) facts.push(`height ${Math.round(heightCm)} cm`);
  // Les libelles Wikidata contiennent deja le mot (« brown hair », « blue eyes ») :
  // ne pas le repeter.
  if (hair)     facts.push(/hair/i.test(hair) ? hair : `${hair} hair`);
  if (eyes)     facts.push(/eyes?/i.test(eyes) ? eyes : `${eyes} eyes`);

  const known = entity.descriptions?.en?.value ?? entity.descriptions?.fr?.value ?? "";

  const description = [
    facts.length ? `Verified facts: ${facts.join("; ")}.` : "",
    known ? `Known as: ${known}.` : "",
    summary ? `Encyclopedia summary: ${summary}` : "",
  ].filter(Boolean).join(" ");

  return {
    query:      name,
    name:       canonicalName,
    description,
    imageUrls:  imageUrls.slice(0, MAX_IMAGES),
    sources:    sources.slice(0, 4),
    via:        ["wikidata", ...(summary ? ["wikipedia"] : []), ...(imageUrls.length ? ["commons"] : [])],
    confidence: imageUrls.length > 0 ? "high" : "medium",
  };
}

// ─── Claude + recherche web (optionnel) ─────────────────────────────────────
//
// Produit une description physique précise à partir de sources en ligne
// récentes. N'est active que si ANTHROPIC_API_KEY est défini ; sinon on garde
// la description encyclopédique. Toute erreur est absorbée.

const APPEARANCE_SYSTEM =
  "You research the physical appearance of a real, named person so that an image model can render " +
  "their true likeness instead of inventing a generic face. " +
  "Search the web for recent photographs, profiles and articles about this exact person. " +
  "Then write ONE dense English paragraph (max 130 words) describing ONLY their observable physical " +
  "appearance and personal style: apparent age, sex, ethnicity and precise skin tone, face shape, " +
  "jawline, nose, eyes (color and shape), eyebrows, lips, hair (exact color, length, texture, usual cut), " +
  "facial hair, build and approximate height, posture, distinctive marks (tattoos, scars, moles, glasses, " +
  "piercings, dental features) and their habitual clothing style. " +
  "Use only what the sources actually show. Never invent a detail. " +
  "If the sources are too thin, or you are not certain the sources describe this exact person, " +
  "reply with exactly: UNKNOWN. " +
  "Output the paragraph alone, with no preamble, no list, no citation markers.";

type WebResearch = { description: string; sources: string[] } | null;

async function describeWithClaude(name: string, hint: string): Promise<WebResearch> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const client = new Anthropic();

    const response = await client.beta.messages.create(
      {
        model:      "claude-opus-5",
        max_tokens: 2000,
        betas:      ["server-side-fallback-2026-07-01"],
        fallbacks:  "default",
        output_config: { effort: "low" },
        system:     APPEARANCE_SYSTEM,
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
        messages: [
          {
            role: "user",
            content:
              `Person to research: "${name}".` +
              (hint ? ` Context already verified: ${hint}` : "") +
              ` Describe their physical appearance as specified.`,
          },
        ],
      },
      { timeout: 40_000, maxRetries: 1 },
    );

    if (response.stop_reason === "refusal") return null;

    const texts:   string[] = [];
    const sources: string[] = [];

    for (const block of response.content) {
      if (block.type === "text") {
        texts.push(block.text);
      } else if (block.type === "web_search_tool_result") {
        // En erreur, `content` est un objet unique et non une liste.
        const content = block.content;
        if (Array.isArray(content)) {
          for (const r of content) {
            if ("url" in r && typeof r.url === "string") sources.push(r.url);
          }
        }
      }
    }

    const description = texts.join(" ").replace(/\s+/g, " ").trim();
    if (!description || /^UNKNOWN\b/i.test(description)) return null;

    return { description, sources: sources.slice(0, 5) };
  } catch (err) {
    console.warn(`[PersonLookup] Claude web search indisponible pour "${name}":`, err);
    return null;
  }
}

// ─── API publique ───────────────────────────────────────────────────────────

/**
 * Recherche en ligne une personne nommée dans le prompt.
 * Retourne null si aucun être humain ne correspond avec certitude.
 */
export async function lookupPersonOnline(name: string): Promise<PersonProfile | null> {
  const key = normalizeName(name);
  if (!key) return null;

  const cached = cacheGet(key);
  if (cached) return cached.value;

  const encyclopedia = await lookupEncyclopedia(name);

  // Sans identité confirmée, on ne sait pas de qui il s'agit : on s'abstient
  // plutôt que de risquer une description inventée ou un homonyme.
  if (!encyclopedia) {
    cacheSet(key, null);
    return null;
  }

  // Description physique détaillée par recherche web (si la clé est présente).
  const web = await describeWithClaude(
    encyclopedia.name,
    encyclopedia.description.slice(0, 400),
  );

  const profile: PersonProfile = web
    ? {
        ...encyclopedia,
        description: `${web.description} ${encyclopedia.description}`.trim(),
        sources:     [...encyclopedia.sources, ...web.sources].slice(0, 8),
        via:         [...encyclopedia.via, "claude-web-search"],
        confidence:  "high",
      }
    : encyclopedia;

  cacheSet(key, profile);
  return profile;
}

/**
 * Cherche en ligne toutes les personnes nommées dans un prompt.
 * `exclude` : noms déjà résolus par CELEBRITY_DB (inutile de les rechercher).
 */
export async function lookupPersonsInPrompt(
  prompt:  string,
  exclude: string[] = [],
  maxPersons = 2,
): Promise<PersonProfile[]> {
  const excluded   = new Set(exclude.map(normalizeName));
  const candidates = extractPersonNames(prompt).filter(
    (c) => !excluded.has(normalizeName(c)),
  );
  if (candidates.length === 0) return [];

  const found   = new Map<string, PersonProfile>();
  const matched = new Set<string>();

  for (const candidate of candidates) {
    if (found.size >= maxPersons) break;
    // Un candidat déjà couvert par une personne trouvée (« Kylian » après
    // « Kylian Mbappé ») ne relance pas de recherche.
    if ([...matched].some((n) => n.includes(normalizeName(candidate)))) continue;

    const profile = await lookupPersonOnline(candidate);
    if (!profile) continue;

    const id = normalizeName(profile.name);
    if (found.has(id) || excluded.has(id)) continue;

    found.set(id, profile);
    matched.add(id);
    console.log(
      `[PersonLookup] "${candidate}" → ${profile.name} ` +
      `(${profile.imageUrls.length} photo(s), sources: ${profile.via.join("+")})`,
    );
  }

  return [...found.values()];
}
