import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const MODELS = {
  faceSwap: "codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34",
  video:    "bytedance/seedance-2.0-fast",
} as const;

// ─── Créer mode: img2img fallback chain ──────────────────────────────────────
//
// These models take the uploaded photo as DIRECT visual input (image-to-image).
// The person in the photo is preserved; the prompt controls scene/style.
// If a prediction fails/cancels, the poll handler retries with the next model.

type Img2ImgModelSpec = {
  spec:       string;
  buildInput: (prompt: string, negPrompt: string, imageUrl: string, strength: number, resolution?: string, celebRefB64?: string, allCelebRefs?: string[], outputFormat?: string, allowFallback?: boolean, aspectRatio?: string) => Record<string, unknown>;
};

export const STYLE_MODELS: Img2ImgModelSpec[] = [
  {
    spec: "google/nano-banana-2",
    // Correct API schema: image_input is an array of URIs, no strength param.
    // Passing image + strength was silently ignored — photo was never used.
    buildInput: (prompt, _neg, imageUrl, _strength, resolution = "1K", _primary?: string, allRefs?: string[], outputFormat?: string, _allowFallback?: boolean, aspectRatio?: string) => ({
      prompt,
      // user's photo first, then all celebrity reference images (up to tier limit)
      image_input:          allRefs && allRefs.length > 0
        ? [imageUrl, ...allRefs]
        : [imageUrl],
      // Ratio explicite calculé depuis la photo d'entrée → conserve l'orientation
      // (vertical / carré / horizontal). "match_input_image" reste le repli.
      aspect_ratio:         aspectRatio ?? "match_input_image",
      resolution,
      output_format:        outputFormat ?? "jpg",
      // nano-banana-2 n'accepte ni safety_filter_level ni allow_fallback_model.
    }),
  },
  {
    // Secours : nano-banana-2 n'a pas de reglage du filtre de securite et
    // bloque souvent les personnalites reelles (erreur E005). En cas d'echec,
    // la route /poll relance automatiquement ici, avec le meme prompt brut et
    // le filtre au niveau le plus permissif.
    spec: "google/nano-banana-pro",
    buildInput: (prompt, _neg, imageUrl, _strength, resolution = "1K", _primary?: string, allRefs?: string[], outputFormat?: string, allowFallback?: boolean, aspectRatio?: string) => ({
      prompt,
      image_input:          allRefs && allRefs.length > 0
        ? [imageUrl, ...allRefs]
        : [imageUrl],
      aspect_ratio:         aspectRatio ?? "match_input_image",
      resolution,
      output_format:        outputFormat ?? "jpg",
      safety_filter_level:  "block_only_high",
      allow_fallback_model: allowFallback ?? true,
    }),
  },
];

export const STYLE_MODEL_COUNT = STYLE_MODELS.length;

// ─── Dimension table ──────────────────────────────────────────────────────────
export const ZIMAGE_DIMS: Record<string, { width: number; height: number }> = {
  square:    { width: 1024, height: 1024 },
  portrait:  { width: 832,  height: 1152 },
  landscape: { width: 1216, height: 832  },
  auto:      { width: 832,  height: 1152 },
};

// ─── Quality settings per subscription tier ───────────────────────────────────
//
// resolution     → output resolution (faster + cheaper at 1K)
// format         → jpg for lossy compression, png lossless for ultra
// maxRefImages   → max celeb reference photos passed to the model
// allowFallback  → Replicate may route to a faster/cheaper model variant
// Le plan ne fait varier QUE la resolution et le format de sortie. Le prompt
// envoye au modele est le texte brut de l'utilisateur, sans ajout interne.
const QUALITY_SETTINGS = {
  free:      { format: "jpg" as const, resolution: "1K", maxRefImages: 0, allowFallback: true  },
  essentiel: { format: "jpg" as const, resolution: "1K", maxRefImages: 1, allowFallback: true  },
  pro:       { format: "jpg" as const, resolution: "2K", maxRefImages: 2, allowFallback: false },
  ultra:     { format: "png" as const, resolution: "4K", maxRefImages: 3, allowFallback: false },
} as const;

/** Personne a ajouter, resolue AVANT la generation :
 *  - source "db"  : trouvee dans CELEBRITY_DB (description locale verifiee)
 *  - source "web" : trouvee par recherche en ligne (Wikipedia / Wikidata /
 *                   Commons / Claude + web search) pour les noms absents de la
 *                   base — typiquement des personnes moins connues.
 *  Le modele d'image ne navigue pas : la recherche est faite cote serveur et le
 *  resultat (photos reelles + description verifiee) lui est fourni en entree. */
export type ResolvedPerson = {
  name:               string;
  visual_description: string;
  source:             "db" | "web";
  /** Pages consultees en ligne (Wikipedia, Wikidata, articles) */
  sources?:           string[];
  /** Nombre de photos de reference reellement transmises au modele */
  refCount?:          number;
};

export interface PipelineInput {
  mode:               "style" | "swapface" | "video";
  /** Vidéo IA : URL publique de la vidéo source uploadée ([Video1] pour Seedance) */
  videoUrl?:          string;
  /** Vidéo IA : options "addObject" / "replaceObject" cochées dans le dashboard */
  videoObjectOptions?: string[];
  /** Vidéo IA : entités détectées dans le prompt (montres, célébrités) avec leurs refs.
   *  `wear: true` = montre choisie dans le sélecteur → portée au poignet du sujet. */
  videoRefEntities?:  { name: string; visual_description: string; refCount: number; wear?: boolean }[];
  inputImageUrl?:     string;
  styleId?:           string;
  stylePrompt?:       string;
  customPrompt?:      string;
  sourceImageUrl?:    string;
  targetImageUrl?:    string;
  faceIndex?:         string;
  extraPrompt?:       string;
  qualityTier?:       keyof typeof QUALITY_SETTINGS;
  renderStyle?:       string;
  transformIntensity?: string;
  outputFormat?:      string;
  /** Ratio d'aspect explicite (ex. "9:16") calculé depuis la photo d'entrée. */
  aspectRatio?:       string;
  preserveOutfit?:    boolean;
  celebRefImageUrl?:  string;
  celebRefImageUrls?: string[];
  celebRefCount?:     number;
  celebName?:         string;
  celebGender?:       string;
  /** Personnes resolues en amont (base locale + recherche en ligne) */
  resolvedPersons?:   ResolvedPerson[];
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const is429 = msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("throttled");
      if (is429 && attempt < retries) {
        const match = msg.match(/"retry_after"\s*:\s*(\d+)/);
        const waitMs = match ? (Number(match[1]) + 2) * 1000 : 15000;
        console.log(`[Pipeline] Rate limited – waiting ${waitMs / 1000}s (retry ${attempt + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, waitMs));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

// ─── VIDEO PROMPT BUILDER (Seedance 2.0) ─────────────────────────────────────
//
// Seedance attend un prompt naturel, écrit comme dans son playground :
// les entrées se référencent [Video1], [Image1], [Image2]…
// Pas de contrat système géant (conçu pour l'img2img, contre-productif ici).

function buildVideoPrompt(
  customPrompt:  string,
  objectOptions: string[] = [],
  refEntities:   { name: string; visual_description: string; refCount: number; wear?: boolean }[] = [],
): string {
  const userInstruction = translateToEnglish(customPrompt.trim())
    || "Enhance this video with cinematic quality.";

  const parts: string[] = [];

  // La vidéo source uploadée est toujours [Video1]
  parts.push(`Based on the source video [Video1]: ${userInstruction}.`);

  if (objectOptions.includes("replaceObject")) {
    parts.push(
      "Replace the corresponding object in [Video1] frame by frame, " +
      "perfectly tracking its position, perspective, motion and lighting. " +
      "Everything else in the video stays exactly as in [Video1].",
    );
  }
  if (objectOptions.includes("addObject")) {
    parts.push(
      "Insert the requested element seamlessly into the scene of [Video1], " +
      "matching the original camera motion, lighting and framing. " +
      "Everything else in the video stays exactly as in [Video1].",
    );
  }

  // Références visuelles (montres de luxe, célébrités) — [Image1], [Image2]…
  let imgIdx = 1;
  for (const ent of refEntities) {
    if (ent.refCount <= 0) {
      parts.push(
        `${ent.name} appearance reference: ${ent.visual_description}`,
      );
      continue;
    }
    const range = ent.refCount === 1
      ? `[Image${imgIdx}]`
      : `[Image${imgIdx}] to [Image${imgIdx + ent.refCount - 1}]`;
    parts.push(
      `${range} ${ent.refCount === 1 ? "shows" : "show"} the exact ${ent.name} — ` +
      `${ent.visual_description} ` +
      `Reproduce it with perfect fidelity to these reference images: ` +
      `same shape, materials, colors, proportions and distinctive details, ` +
      `consistent in every frame.` +
      (ent.wear
        ? ` The person in [Video1] wears this exact ${ent.name} on their wrist, ` +
          `clearly visible and naturally integrated with their movements.`
        : ""),
    );
    imgIdx += ent.refCount;
  }

  parts.push(
    "Photorealistic result, natural motion, no morphing, no flickering, " +
    "temporally consistent across all frames.",
  );

  return parts.join(" ");
}

// ─── img2img strength — controlled by transformIntensity ─────────────────────
//
// lower = preserve more of the original person
// higher = follow the prompt more aggressively

function intensityToStrength(intensity?: string): number {
  // Very low values: the base image is treated as a near-fixed canvas.
  // The model adds/modifies only what the prompt requests and preserves
  // the rest of the original photograph as closely as possible.
  switch (intensity) {
    case "light":  return 0.12;
    case "strong": return 0.38;
    default:       return 0.20; // moderate
  }
}

// ─── Output resolution — controlled by transformIntensity ─────────────────────
//
// La résolution de SORTIE dépend du choix « Qualité de génération » du
// dashboard. Le modèle (google/nano-banana-2) ne change pas.
//
//   light    (Qualité de base) → 1K
//   moderate (Normale)         → 2K
//   ultra    (Ultra 4K)        → 4K
function intensityToResolution(_tierResolution: string, intensity?: string): string {
  switch (intensity) {
    case "light":    return "1K"; // Qualité de base
    case "strong":                 // ancien choix « Intense », retiré de l interface
    case "ultra":    return "4K"; // Ultra 4K
    case "moderate":
    default:         return "2K"; // Normale
  }
}

// ─── FRENCH → ENGLISH TRANSLATOR ─────────────────────────────────────────────

function translateToEnglish(text: string): string {
  if (!text) return text;
  type Rule = [RegExp, string];
  const rules: Rule[] = [
    [/\b(?:mets?(?:\s+moi)?|met(?:\s+moi)?|fais(?:\s+moi)?|donne(?:\s+moi)?|place(?:\s+moi)?|change(?:\s+moi)?|transforme(?:\s+moi)?|rends?(?:\s+moi)?)\b/gi, ""],
    [/\b(?:s'il te plaît|stp|svp|please)\b/gi, ""],
    [/\bajoute(?:r)?\s+/gi, "add "],
    [/\bremplace(?:r)?\s+/gi, "replace "],
    [/\bma\s+montre\b/gi, "my watch"],
    [/\bsa\s+montre\b/gi, "their watch"],
    [/\bau\s+poignet\b/gi, "on the wrist"],
    [/\bpar\s+(?=la\b|le\b|une?\b|the\b|a\b)/gi, "with "],
    [/\bà\s+côté\s+de\b/gi, "next to"],
    [/\bà\s+coté\s+de\b/gi, "next to"],
    [/\bcôte\s+à\s+côte\b/gi, "side by side"],
    [/\bpose\s*(?:[-–])?(?:\s*toi)?\s+avec\b/gi, "standing with"],
    [/\bmets\s*[-–]?\s*(?:toi|moi)\s+avec\b/gi, "standing with"],
    [/\bà\s+côté\b/gi, "next to"],
    [/\baux\s+côtés\s+de\b/gi, "alongside"],
    [/\bensemble\s+avec\b/gi, "together with"],
    [/\bprès\s+de\b/gi, "next to"],
    [/fond\s+(?:de\s+)?plage|fond\s+plage/gi, "beach background with ocean"],
    [/fond\s+(?:de\s+)?ville|fond\s+urbain/gi, "city skyline background"],
    [/fond\s+(?:de\s+)?forêt/gi, "forest background"],
    [/fond\s+(?:de\s+)?montagne/gi, "mountain landscape background"],
    [/fond\s+(?:de\s+)?coucher\s+de\s+soleil/gi, "sunset background"],
    [/fond\s+blanc/gi, "clean white studio background"],
    [/fond\s+noir/gi, "pure black background"],
    [/fond\s+flou|fond\s+bokeh/gi, "blurred bokeh background"],
    [/fond\s+studio/gi, "professional studio background"],
    [/fond\s+(?:de\s+)?bureau/gi, "office background"],
    [/fond\s+(?:de\s+)?luxe|fond\s+(?:de\s+)?villa/gi, "luxury villa background"],
    [/(?:change|remplace)\s+(?:le\s+)?fond/gi, "replace background with"],
    [/\bfond\b/gi, "background"],
    [/à\s+la\s+plage/gi, "at the beach"],
    [/à\s+paris/gi, "in Paris"],
    [/à\s+new\s*york/gi, "in New York"],
    [/à\s+dubai/gi, "in Dubai"],
    [/dans\s+une?\s+villa/gi, "in a luxury villa"],
    [/dans\s+une?\s+forêt/gi, "in a forest"],
    [/au\s+bureau/gi, "in an office setting"],
    [/en\s+plein\s+air/gi, "outdoors in natural setting"],
    [/noir\s+et\s+blanc|n&b|n&w|nbw/gi, "black and white"],
    [/sépia/gi, "sepia tone"],
    [/coloré/gi, "vibrant colors"],
    [/couleurs\s+vives/gi, "vivid saturated colors"],
    [/ton\s+chaud|tons?\s+chauds?/gi, "warm golden tones"],
    [/ton\s+froid|tons?\s+froids?/gi, "cool blue tones"],
    [/contraste\s+(?:élevé|fort|haut)/gi, "high contrast"],
    [/saturé/gi, "vibrant saturated"],
    [/style\s+(?:artistique|art)/gi, "artistic fine art style"],
    [/style\s+vintage|effet\s+vintage/gi, "vintage retro style"],
    [/style\s+cinématographique|look\s+ciném/gi, "cinematic film style"],
    [/style\s+(?:magazine|fashion)/gi, "high fashion editorial style"],
    [/style\s+(?:luxe|luxueux)/gi, "luxury high-end style"],
    [/peinture\s+(?:à\s+l'huile|huile)/gi, "oil painting style"],
    [/aquarelle/gi, "watercolor style"],
    [/anime|manga/gi, "anime style"],
    [/effet\s+3d/gi, "3D CGI style"],
    [/réaliste|réalisme/gi, "photorealistic"],
    [/professionnel/gi, "professional"],
    [/futuriste|cyberpunk/gi, "futuristic cyberpunk"],
    [/luxueux|luxe/gi, "luxury"],
    [/lumière\s+(?:dorée|chaude)/gi, "warm golden lighting"],
    [/lumière\s+naturelle/gi, "soft natural daylight"],
    [/lumière\s+(?:de\s+)?studio/gi, "professional studio lighting"],
    [/éclairage\s+(?:dramatique|fort)/gi, "dramatic cinematic lighting"],
    [/coucher\s+de\s+soleil/gi, "golden sunset"],
    [/lever\s+de\s+soleil/gi, "soft sunrise"],
    [/néon/gi, "neon lights"],
    [/tenue\s+de\s+soirée|costume\s+de\s+soirée/gi, "elegant formal evening attire"],
    [/tenue\s+(?:décontractée|casual)/gi, "casual stylish outfit"],
    [/tenue\s+sportive|look\s+sportif/gi, "athletic sportswear"],
    [/tenue\s+militaire/gi, "military uniform"],
    [/tenue\s+royale|robe\s+royale/gi, "royal elegant gown"],
    [/smoking/gi, "black tuxedo"],
    [/en\s+costume/gi, "in a tailored suit"],
    [/robe\s+rouge/gi, "red dress"],
    [/en\s+jean/gi, "wearing jeans"],
    [/cheveux\s+blonds/gi, "blonde hair"],
    [/cheveux\s+bruns/gi, "brown hair"],
    [/cheveux\s+noirs/gi, "black hair"],
    [/cheveux\s+rouges/gi, "red hair"],
    [/cheveux\s+bouclés/gi, "curly hair"],
    [/cheveux\s+raides/gi, "straight hair"],
    [/cheveux\s+longs/gi, "long hair"],
    [/cheveux\s+courts/gi, "short hair"],
    [/barbe/gi, "beard"],
    [/rasé/gi, "clean-shaven"],
    [/maquillage\s+(?:fort|prononcé)/gi, "bold dramatic makeup"],
    [/maquillage\s+naturel/gi, "natural minimal makeup"],
    [/sans\s+maquillage/gi, "no makeup"],
    [/haute\s+qualité|hd|4k|8k/gi, "ultra high definition"],
    [/améliore?\s+(?:la\s+)?qualité/gi, "improve image quality"],
    [/\bavec\s+/gi, "with "],
    [/\bsur\s+/gi, "on "],
    [/\bdans\s+/gi, "in "],
    [/\bun\b/gi, "a"],
    [/\bune\b/gi, "a"],
    [/\ble\b/gi, "the"],
    [/\bla\b/gi, "the"],
    [/\bles\b/gi, "the"],
    [/\bdu\b/gi, "of the"],
    [/\bde\b/gi, "of"],
    [/\bet\b/gi, "and"],
  ];
  let result = text;
  for (const [pattern, replacement] of rules) {
    result = result.replace(pattern, replacement);
  }
  return result.replace(/\s+/g, " ").trim();
}

// ─── IMAGE UTILITIES ──────────────────────────────────────────────────────────

async function downloadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept":     "image/webp,image/jpeg,image/png,image/*",
      },
    });
    if (!res.ok) {
      console.warn(`[downloadImageAsBase64] HTTP ${res.status} for ${url.slice(0, 120)}`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      console.warn(`[downloadImageAsBase64] Bad content-type "${contentType}" for ${url.slice(0, 120)}`);
      return null;
    }
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.warn(`[downloadImageAsBase64] fetch error for ${url.slice(0, 120)}:`, err);
    return null;
  }
}

async function loadImageAsBase64(urlOrData: string): Promise<string> {
  if (urlOrData.startsWith("data:")) return urlOrData;
  const b64 = await downloadImageAsBase64(urlOrData);
  if (!b64) throw new Error(`Impossible de charger l'image depuis : ${urlOrData.slice(0, 80)}`);
  return b64;
}

function extractUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) return String(output[0]);
  if (output && typeof output === "object" && "url" in output)
    return String((output as { url: string }).url);
  throw new Error("Aucune URL retournée par le modèle IA");
}

// ─── ASYNC JOB API ────────────────────────────────────────────────────────────

export type AsyncJobConfig = {
  mode:               "style" | "swapface" | "video";
  videoUrl?:          string;
  qualityTier:        keyof typeof QUALITY_SETTINGS;
  prompt?:            string;
  negPrompt?:         string;
  inputImageUrl?:     string;
  strength?:          number;
  sourceB64?:         string;
  modelIndex?:        number;
  resolution?:        string;
  outputFormat?:      string;
  allowFallback?:     boolean;
  aspectRatio?:       string;
  celebRefImageUrl?:  string;
  celebRefImageUrls?: string[];
  celebRefCount?:     number;
  celebName?:         string;
  celebGender?:       string;
};

async function createPred(
  spec:  string,
  input: Record<string, unknown>,
): Promise<{ id: string }> {
  const colonIdx = spec.lastIndexOf(":");
  if (colonIdx > 5 && spec.length - colonIdx > 20) {
    return withRetry(() => replicate.predictions.create({ version: spec.substring(colonIdx + 1), input }), 3);
  }
  // withRetry : attend et reessaie sur 429 (Replicate limite a 6 creations/min
  // quand le compte a moins de 5 $ de credit).
  return withRetry(() => replicate.predictions.create({ model: spec, input }), 3);
}

export function buildAsyncJobConfig(
  input:     PipelineInput,
  sourceB64: string,
): AsyncJobConfig {
  const tier = input.qualityTier ?? "essentiel";

  if (input.mode === "swapface") {
    return { mode: "swapface", qualityTier: tier, sourceB64 };
  }

  if (input.mode === "video") {
    // ── Seedance 2.0 Fast (vidéo IA) ────────────────────────────────────────
    // Le prompt est écrit comme s'il était saisi directement dans le modèle :
    // [Video1] = vidéo source, [Image1..N] = photos de référence Supabase.
    const refUrls = (input.celebRefImageUrls ?? []).slice(0, 9); // limite Seedance
    return {
      mode:              "video",
      qualityTier:       tier,
      videoUrl:          input.videoUrl,
      prompt:            buildVideoPrompt(
        input.customPrompt ?? "",
        input.videoObjectOptions ?? [],
        input.videoRefEntities   ?? [],
      ),
      celebRefImageUrls: refUrls,
      celebRefCount:     refUrls.length,
    };
  }

  // ── nano-banana-2 (style / scene transformation) ───────────────────────
  // Envoi BRUT : le modele recoit uniquement la photo de l utilisateur et le
  // texte qu il a saisi, exactement comme dans le playground Nano Banana 2.
  // Aucun prompt interne (verrou, integration, contrat systeme, traduction),
  // aucune photo de reference ajoutee.
  const qs = QUALITY_SETTINGS[tier];
  const rawPrompt = (input.customPrompt ?? "").trim() || (input.stylePrompt ?? "").trim();

  return {
    mode:               "style",
    qualityTier:        tier,
    prompt:             rawPrompt,
    negPrompt:          "",
    inputImageUrl:      input.inputImageUrl,
    strength:           intensityToStrength(input.transformIntensity),
    modelIndex:         0,
    resolution:         intensityToResolution(qs.resolution, input.transformIntensity),
    outputFormat:       qs.format,
    allowFallback:      qs.allowFallback,
    aspectRatio:        input.aspectRatio,
    celebRefImageUrl:   undefined,
    celebRefImageUrls:  [],
    celebRefCount:      0,
  };
}

export async function startAsyncJob(
  config:     AsyncJobConfig,
  targetB64?: string,
): Promise<string> {
  if (config.mode === "swapface") {
    const p = await createPred(MODELS.faceSwap, {
      swap_image:  config.sourceB64!,
      input_image: targetB64!,
    });
    return p.id;
  }

  if (config.mode === "video") {
    // ── Seedance 2.0 Fast ────────────────────────────────────────────────────
    // reference_videos / reference_images acceptent des URLs directes.
    // reference_images est incompatible avec image (first frame) — on n'utilise
    // que le mode références, qui couvre montage vidéo + fidélité produit.
    if (!config.videoUrl) throw new Error("Vidéo source manquante pour la génération");

    const input: Record<string, unknown> = {
      prompt:           config.prompt ?? "",
      reference_videos: [config.videoUrl],
      resolution:       "720p",
      aspect_ratio:     "adaptive",
      duration:         -1,   // durée intelligente : le modèle suit la vidéo source
      generate_audio:   true,
    };

    const refs = (config.celebRefImageUrls ?? []).slice(0, 9);
    if (refs.length > 0) input.reference_images = refs;

    console.log(`[Pipeline] video model: ${MODELS.video}`);
    console.log(`[Pipeline] Prompt: "${(config.prompt ?? "").slice(0, 300)}"`);
    console.log(`[Pipeline] Reference images: ${refs.length}`);

    const p = await createPred(MODELS.video, input);
    return p.id;
  }

  const modelIdx = config.modelIndex ?? 0;
  const model    = STYLE_MODELS[modelIdx];
  if (!model) throw new Error(`Tous les ${STYLE_MODEL_COUNT} modèles ont échoué`);

  if (!config.inputImageUrl) throw new Error("Image source manquante pour la génération");

  // Download user image to base64
  const imageData = await loadImageAsBase64(config.inputImageUrl);

  // Download all celebrity reference images (up to 3) and convert to base64
  const refUrls: string[] = [
    ...(config.celebRefImageUrls ?? []),
    ...(config.celebRefImageUrl && !config.celebRefImageUrls?.includes(config.celebRefImageUrl)
      ? [config.celebRefImageUrl]
      : []),
  ].slice(0, 3);

  const celebRefB64s: string[] = [];
  for (const url of refUrls) {
    const b64 = await downloadImageAsBase64(url);
    if (b64) celebRefB64s.push(b64);
  }

  console.log(`[Pipeline] img2img model [${modelIdx}]: ${model.spec}`);
  console.log(`[Pipeline] Prompt: "${(config.prompt ?? "").slice(0, 200)}"`);
  console.log(`[Pipeline] Strength: ${config.strength ?? 0.62}`);
  console.log(`[Pipeline] Celebrity refs: ${celebRefB64s.length > 0 ? celebRefB64s.length : "none"}`);

  const p = await createPred(
    model.spec,
    model.buildInput(
      config.prompt       ?? "",
      config.negPrompt    ?? "",
      imageData,
      config.strength     ?? 0.62,
      config.resolution,
      celebRefB64s[0],
      celebRefB64s,
      config.outputFormat,
      config.allowFallback,
      config.aspectRatio,
    ),
  );
  return p.id;
}

export type AdvanceResult =
  | { done: true;  outputUrl: string }
  | { done: false; predictionId: string; step: number };

export async function advanceAsyncJob(
  _config:    AsyncJobConfig,
  _step:      number,
  predOutput: unknown,
): Promise<AdvanceResult> {
  return { done: true, outputUrl: extractUrl(predOutput) };
}

export { replicate, withRetry, loadImageAsBase64 };
