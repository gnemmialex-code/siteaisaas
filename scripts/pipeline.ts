import Replicate from "replicate";
import { findAllCelebrities, buildCelebrityContext } from "@/lib/celebrity-db";

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

const NEG = "blurry, low quality, cartoon, anime, illustration, distorted, ugly, deformed, nsfw, different person, extra limbs";

export const STYLE_MODELS: Img2ImgModelSpec[] = [
  {
    spec: "google/nano-banana-pro",
    // Correct API schema: image_input is an array of URIs, no strength param.
    // Passing image + strength was silently ignored — photo was never used.
    buildInput: (prompt, _neg, imageUrl, _strength, resolution = "1K", _primary?: string, allRefs?: string[], outputFormat?: string, allowFallback?: boolean, aspectRatio?: string) => ({
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
// Le plan ne fait varier QUE la resolution, le format de sortie, le repli
// modele et le nombre de photos de reference celebrite autorisees.
// Les regles de generation (image de base intouchee + integration physique de
// la personne ajoutee) sont identiques pour free / essentiel / pro / ultra :
// voir BASE_IMAGE_LOCK et ADDED_PERSON_INTEGRATION plus bas.
const QUALITY_SETTINGS = {
  free:      { format: "jpg" as const, resolution: "1K", maxRefImages: 0, allowFallback: true  },
  essentiel: { format: "jpg" as const, resolution: "1K", maxRefImages: 1, allowFallback: true  },
  pro:       { format: "jpg" as const, resolution: "2K", maxRefImages: 2, allowFallback: false },
  ultra:     { format: "png" as const, resolution: "4K", maxRefImages: 3, allowFallback: false },
} as const;

// ─── Render style descriptors ─────────────────────────────────────────────────
const RENDER_STYLE_PROMPTS: Record<string, string> = {
  photoreal: "ultra-photorealistic, sharp natural details, true-to-life colors",
  magazine:  "high-fashion editorial photography, perfect studio lighting, magazine quality",
  cinematic: "cinematic color grading, dramatic shadows and highlights, film quality",
  artistic:  "fine art portrait photography, creative lighting, artistic composition",
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

// ─── HIDDEN SYSTEM CONTEXT ───────────────────────────────────────────────────
//
// Injected silently into every generation prompt.
// Never exposed in the UI. Guides the model for maximum precision on:
//   • biometric identity preservation
//   • public figure recognition & accuracy
//   • scene-only transformation
//   • photorealistic integration quality

const HIDDEN_SYSTEM_CONTEXT =
  "ABSOLUTE IMAGE-TO-IMAGE TRANSFORMATION CONTRACT — READ EVERY INSTRUCTION BEFORE GENERATING. " +

  // ── CRITICAL PREAMBLE: the base image is sacred ───────────────────────────
  "CRITICAL PREAMBLE — THE BASE IMAGE IS A FIXED CANVAS THAT MUST NOT BE MODIFIED: " +
  "This is an image-to-image task. You have received an input photograph. That photograph is your fixed canvas. " +
  "Your role is NOT to regenerate this photograph. Your role is NOT to reimagine it. " +
  "Your role is NOT to improve it, reinterpret it, or recreate it from scratch. " +
  "Your sole role is to apply ONLY what the user has explicitly requested on top of this fixed canvas, " +
  "while leaving every single other element of the photograph exactly as it is. " +
  "The person in the input photograph — their face, skin tone, hair, body, clothing, posture, expression — " +
  "must appear in the output as if their pixels were directly transferred from the input without any processing. " +
  "This person must not be regenerated, not be redrawn, not be smoothed, not be altered in any way. " +
  "Their face must be pixel-for-pixel identical to the input. " +
  "Their skin color must be pixel-for-pixel identical to the input. " +
  "Their hair must be pixel-for-pixel identical to the input. " +
  "Their body must be pixel-for-pixel identical to the input. " +
  "If the user says 'add someone next to me' — add only that person. Do not touch me. " +
  "If the user says 'change the background' — change only the background. Do not touch me. " +
  "If the user says 'put me on a beach' — construct the beach scene around me. Do not touch me. " +
  "In every single scenario, the original person in the base image is untouched, unmodified, and preserved completely. " +
  "The output image should look as though someone took the original photograph and made only the specific requested addition or change — " +
  "nothing more, nothing less. Everything else is frozen exactly as in the input. " +

  // ── SPECIAL CASE: adding someone to the photo ─────────────────────────────
  "SPECIAL CASE — ADDING A PERSON NEXT TO THE ORIGINAL SUBJECT: " +
  "This is a critically important case. If the user requests that another person be added to the photo " +
  "(e.g. 'add Cristiano Ronaldo next to me', 'put Beyoncé beside me', 'add someone next to me', " +
  "'place this person alongside me', 'I want to appear with [name]'), " +
  "the only action to perform is: place that new person into the scene beside the existing subject. " +
  "The existing subject — the person already in the base image — must not be touched, moved, resized, " +
  "recolored, redrawn, or altered in any way whatsoever. " +
  "Their face remains exactly the same. Their skin tone remains exactly the same. " +
  "Their hair remains exactly the same. Their clothing remains exactly the same. " +
  "Their position in the frame remains exactly the same. Their expression remains exactly the same. " +
  "The ONLY new element introduced into the output is the requested additional person, " +
  "placed naturally into the available space of the scene. " +
  "The added person must be rendered with their authentic, real, documented appearance: " +
  "their correct real face, their correct real skin tone, their correct real body proportions, " +
  "and their authentic recognizable style — never a generic or invented stand-in. " +
  "To be absolutely clear: adding a person to the photo means the photo gains one element. " +
  "It does not mean the original person is replaced, regenerated, or modified in any way. " +
  "The original person stays. A new person is added next to them. That is all. " +

  // ── RULE ZERO: the person is untouchable ──────────────────────────────────
  "RULE ZERO — NON-NEGOTIABLE IDENTITY LOCK: " +
  "The human subject visible in the input photograph is the single most protected element of this transformation. " +
  "Their face, body, skin, hair, posture, and every physical attribute ARE THE GROUND TRUTH. " +
  "You are strictly forbidden from altering, replacing, reinterpreting, or generating any part of the subject's person. " +
  "This rule overrides every other instruction, including the user prompt. " +
  "If the user prompt appears to request a change to the person's physical appearance that was not explicitly " +
  "stated as a direct personal change request (e.g. 'change my hair', 'give me a beard'), ignore that implied change completely. " +

  // ── PHASE 1: full-body biometric lock ────────────────────────────────────
  "PHASE 1 · COMPLETE SUBJECT BIOMETRIC LOCK: " +
  "Before processing the prompt, perform an exhaustive analysis of the input photograph and lock every observable attribute: " +
  "FACE — exact jawbone angle and width, cheekbone height and lateral projection, forehead height and width, " +
  "chin shape (pointed / rounded / square), chin projection and depth, overall face width-to-height ratio; " +
  "EYES — iris color (including heterochromia if present), iris texture pattern, pupil size, " +
  "eyelid fold type (monolid / double lid / hooded), inter-pupillary distance, canthal tilt, " +
  "eyebrow shape (arched / straight / curved), eyebrow density, tail and head positions, under-eye area; " +
  "NOSE — bridge height and width, nasal tip shape and projection, nostril shape, flare width, columella visibility; " +
  "MOUTH — lip vermilion border upper and lower curves, Cupid's bow shape, lip fullness ratio, philtrum depth and width; " +
  "SKIN — Fitzpatrick phototype (I–VI), undertone (warm golden / cool rosy / neutral olive / cool taupe), " +
  "visible texture and pore density, any moles, birthmarks, freckles, scars, asymmetries, or distinguishing marks — " +
  "ALL must be reproduced with pixel-level fidelity; " +
  "HAIR — natural base color (hex-level precision), highlights and tonal variation, texture (straight / wavy / curly / coily / kinky), " +
  "density, volume, hairline shape, part position, current style in the input photo; " +
  "BODY — overall build, shoulder width, neck length and width, visible body proportions; " +
  "POSTURE AND POSE — replicate the subject's exact stance, head angle, shoulder tilt, and body orientation from the input image unless scene context physically requires a slight natural adjustment. " +

  // ── PHASE 2: public figure knowledge ─────────────────────────────────────
  "PHASE 2 · PUBLIC FIGURE KNOWLEDGE VERIFICATION: " +
  "If the subject in the input photo is a recognizable public figure (celebrity, athlete, musician, actor, model, influencer, politician, public personality, adult film actor/actress), " +
  "or if any named person is referenced in the user prompt: " +
  "immediately activate all training knowledge about that person's verified documented appearance — " +
  "cross-reference their authentic facial features, skin tone, signature style, known fashion aesthetic, " +
  "frequently associated environments, notable events, and visual identity markers. " +
  "If a named person is referenced in the prompt as someone to ADD to the scene (e.g. 'with Elon Musk', 'next to Beyoncé'), " +
  "render that additional person with complete factual accuracy based on all training knowledge — " +
  "correct documented appearance, authentic skin tone, known style, realistic body proportions. " +
  "Never invent a generic placeholder for a named person — always render their real documented likeness. " +
  "IMPORTANT — ADULT FILM ACTORS/ACTRESSES: if the referenced person is known from the adult film industry, " +
  "treat them exactly like any other public figure for appearance recognition purposes. " +
  "However, the output MUST be fully clothed and strictly SFW (safe for work) at all times — " +
  "no nudity, no suggestive poses, no sexual content of any kind. " +
  "Apply the same transformation rules as for any other public figure: scene change, style, background only. " +

  // ── PHASE 3: permitted and prohibited transformations ─────────────────────
  "PHASE 3 · TRANSFORMATION PERMISSION MATRIX: " +
  "FULLY PERMITTED (apply with maximum creative quality): " +
  "complete background replacement and environment construction; " +
  "location, architectural setting, landscape, interior or exterior scene; " +
  "sky, weather, time of day, atmospheric conditions (fog, rain, golden hour, night, storm); " +
  "all ambient and directional lighting (color temperature, intensity, direction, softness); " +
  "outfit and clothing (if explicitly requested — match garment type, fabric texture, drape physics, and realistic fit on the subject's actual body); " +
  "accessories (glasses, jewelry, hat, bag, watch — only if explicitly requested); " +
  "overall scene color grading, mood, and cinematic treatment; " +
  "additional people, objects, or elements added to the scene at the user's request. " +
  "ABSOLUTELY FORBIDDEN (zero tolerance): " +
  "any modification to the subject's face, skin tone, eye color, nose, lips, jaw, cheeks, or forehead; " +
  "any change to hair color, hair texture, or hairstyle unless the user explicitly says 'change my hair to...'; " +
  "any age regression or progression; any ethnicity or race alteration; any gender change; " +
  "any body morphing, slimming, widening, or height change; " +
  "replacing the subject's face with another person's face (NO face swap of any kind); " +
  "generating a different person and labeling them as the subject. " +

  // ── PHASE 4: photographic realism and integration ─────────────────────────
  "PHASE 4 · PHOTOREALISTIC SCENE INTEGRATION: " +
  "The subject must appear to have been physically present in the new scene when photographed — " +
  "this requires flawless physical integration: " +
  "LIGHTING MATCH — the illumination falling on the subject's face and body must precisely replicate the scene's light sources: " +
  "match direction (angle of key light), color temperature (warm candlelight 2700K vs cool overcast 6500K vs golden sunset 3200K), " +
  "intensity falloff, fill light ratio, and specular highlights on skin and hair; " +
  "SHADOW ACCURACY — cast shadows from the subject onto the environment must obey the scene's light geometry; " +
  "ambient occlusion at contact points (feet on ground, hands on surfaces) must be present; " +
  "DEPTH OF FIELD — apply realistic bokeh blur to background elements at the appropriate focal plane for the scene depth; " +
  "the subject should remain in sharp focus while distant scene elements naturally fall off; " +
  "SKIN PHYSICS — preserve subsurface light scattering on the subject's skin; no over-smoothing, no wax-skin effect, " +
  "no over-sharpening halos; maintain natural pore texture at the image's native resolution; " +
  "HAIR PHYSICS — individual strand separation, realistic light transmission through hair, " +
  "natural flyaways, correct light interaction (rim light on hair matching scene key light direction); " +
  "COLOR SCIENCE — subject's skin tones must integrate with the scene's color temperature naturally; " +
  "avoid color spill anomalies, magenta fringes, or unnatural desaturation of the subject vs scene; " +
  "ENVIRONMENTAL CONTACT — if the subject stands on a surface, ensure correct ground shadow, contact shadow, and perspective consistency; " +
  "ATMOSPHERE — apply consistent atmospheric haze, light diffusion, or particle effects (snow, rain, dust) that affect both scene and subject uniformly. " +

  // ── PHASE 5: quality and framing preservation ────────────────────────────
  "PHASE 5 · ORIGINAL QUALITY AND FRAMING RESPECT: " +
  "Unless the user explicitly requests 'improve quality', 'enhance', 'HD', '4K', or similar upgrade instructions, " +
  "match the original photograph's technical characteristics: " +
  "replicate the native sharpness level (do not over-sharpen); " +
  "preserve the original grain or noise signature if present (film grain, sensor noise); " +
  "maintain the original aspect ratio and compositional framing of the subject; " +
  "do not artificially increase contrast or saturate colors beyond the scene's natural requirements. " +
  "OUTPUT FRAMING — NON-NEGOTIABLE: The compositional framing of the original person must not change. " +
  "Do not crop the image. Do not zoom in or out. Do not pan or shift the frame. " +
  "Do not reframe, rotate, or resize the canvas. " +
  "The subject must remain in the same position within the frame as in the input photo, at the same scale. " +
  "If a new person is added beside the original subject, they must fit into the existing frame naturally " +
  "without displacing, scaling down, or repositioning the original subject. " +
  "The output image dimensions and aspect ratio must exactly match the input image. " +

  // ── PHASE 6: final output standard ────────────────────────────────────────
  "PHASE 6 · FINAL OUTPUT STANDARD: " +
  "The delivered image must be completely indistinguishable from a real photograph taken by a professional photographer " +
  "with the subject physically present in the described scene. " +
  "Subject identity: identical to input photo, zero deviation. " +
  "Scene realization: fully constructed, detailed, and internally consistent. " +
  "Lighting: physically accurate and unified across subject and scene. " +
  "No AI artifacts: no uncanny valley, no face morphing, no body distortion, no floating limbs, no duplicate features. " +
  "Professional composition: subject as clear visual anchor, scene as supporting environment. " +
  "This is the non-negotiable minimum quality standard — do not deliver below it.";

// ─── REGLES UNIVERSELLES — IDENTIQUES POUR TOUTES LES FORMULES ───────────
//
// Ces deux blocs sont injectes dans CHAQUE generation image, quel que soit
// l'abonnement (free / essentiel / pro / ultra). Le plan ne fait varier que la
// resolution, le format et le nombre de photos de reference — jamais ces regles.
//
//   1. BASE_IMAGE_LOCK          → l'image de base n'est jamais modifiee
//   2. ADDED_PERSON_INTEGRATION → la personne ajoutee est integree
//      physiquement : lumiere, orientation de la lumiere, orientation de la
//      personne, decor, volume 3D, textures realistes, photorealisme total.

const BASE_IMAGE_LOCK =
  "NON-NEGOTIABLE BASE IMAGE LOCK — THIS RULE APPLIES TO EVERY REQUEST, WITHOUT ANY EXCEPTION: " +
  "The input photograph (image 1) is a FINISHED, FROZEN CANVAS. " +
  "It must never be regenerated, re-rendered, repainted, re-lit, re-framed, re-cropped, re-colored, " +
  "retouched, denoised, sharpened, upscaled, stylised or beautified. Treat every pixel of image 1 as already final. " +
  "The person already present in image 1 keeps, pixel for pixel and without the slightest deviation: " +
  "their face and every facial feature, their exact skin tone and skin texture, their hair color, cut and texture, " +
  "their body shape and proportions, their clothing and every fold of it, their pose, their expression, " +
  "their gaze direction, their position in the frame and their scale in the frame. " +
  "The existing background, decor, furniture, objects, colors, exposure, white balance, contrast, grain " +
  "and depth of field of image 1 also stay exactly as they are, unless the user explicitly asked for the scene to change. " +
  "You are performing an ADDITION, never a re-creation: the output must read as the ORIGINAL photograph " +
  "with only the requested element inserted into it, and strictly nothing else changed. " +
  "If you cannot insert the requested element without touching the original, insert it into the free space of the frame — " +
  "never by modifying, moving, shrinking, rotating or redrawing what is already there. " +
  "This lock is independent of the requested quality, resolution or subscription plan: it is always in force. ";

const ADDED_PERSON_INTEGRATION =
  "ADDED PERSON — PHYSICAL INTEGRATION SPECIFICATION (mandatory, applies to every request without exception): " +
  "The added person must look as if they were really standing there, at that exact spot and that exact moment, " +
  "photographed by the same camera, in the same light, as the original subject. " +

  "STEP A · READ THE LIGHT OF IMAGE 1 FIRST. " +
  "Before rendering anything, analyse the lighting of the base photo: " +
  "locate the key light in 3D (left or right, front or back, above or below, near or far), " +
  "measure its color temperature (warm tungsten or candle, neutral daylight, cool shade or overcast, golden hour, night ambient), " +
  "its hardness (hard direct sun with crisp shadow edges versus soft diffused light with gradual falloff), " +
  "the fill-light ratio, the color and direction of bounce light, and any rim, back or practical light in the scene. " +

  "STEP B · MATCH THAT LIGHT EXACTLY ON THE ADDED PERSON. " +
  "The highlights must fall on the SAME side of their face and body as they do on the original subject; " +
  "the shaded side must be the SAME side, with the same shadow density, the same edge softness, " +
  "the same color temperature and the same white balance. " +
  "Never light the added person from the opposite direction. Never put studio lighting on someone standing in a dim room, " +
  "and never put flat ambient light on someone standing in hard directional sunlight. " +
  "Specular highlights on their skin, hair and clothes must point back to the scene's real light sources. " +

  "STEP C · SHADOWS AND GROUND CONTACT. " +
  "Cast their shadow onto the floor and onto nearby surfaces following the same light geometry as the shadows already " +
  "visible in image 1: same direction, same length, same softness, same opacity, same color. " +
  "Add contact shadow and ambient occlusion where their feet meet the ground and wherever they come close to the " +
  "original subject or to scene elements. No floating person, no missing shadow, no shadow going the wrong way. " +

  "STEP D · ORIENTATION, POSE AND PERSPECTIVE. " +
  "Place them on the SAME ground plane as the original subject, consistent with the camera axis of image 1: " +
  "same horizon line, same eye level, same vanishing lines, same focal length and same lens distortion. " +
  "Their body orientation, shoulder line, head angle and gaze must be coherent with that camera — " +
  "if the original subject faces the camera, the added person faces the camera too, unless the user asked otherwise. " +
  "Their pose must read as a natural, relaxed, believable photograph pose beside the original subject, " +
  "with plausible weight distribution, arm placement and spacing between the two people. " +

  "STEP E · SCALE AND DEPTH. " +
  "Their height and body scale must be correct relative to the original subject and to the decor " +
  "(doorways, furniture, vehicles, horizon), and must respect perspective foreshortening at their depth in the scene. " +
  "Render them at the same focus plane and the same depth of field as the original subject: " +
  "identical sharpness or identical bokeh, never sharper, never softer. " +

  "STEP F · DECOR COHERENCE. " +
  "They must belong to the existing decor: same environment, same atmosphere and haze, " +
  "reflections of their body in any nearby glass, water, mirror or polished metal, " +
  "environmental color spill from the decor onto their skin and clothing, " +
  "and the same particles (rain, snow, dust, smoke, sand) crossing their silhouette. " +
  "They occupy the free space of the scene — never floating, never awkwardly clipped by the frame edge, " +
  "never overlapping or hiding the original subject's face or body. " +

  "STEP G · TRUE 3D VOLUME. " +
  "Render them as a real three-dimensional human being, never as a flat cut-out, sticker, paste-in or 2D layer: " +
  "correct volumetric shading across the whole form, believable form shadows and core shadows, " +
  "correct self-occlusion between their limbs, torso and head, correct occlusion with the scene, " +
  "natural silhouette edges carrying real edge light — no hard cut-out outline, no halo, no glow, " +
  "no visible compositing seam, no artificial drop shadow, no resolution mismatch at their border. " +

  "STEP H · REALISTIC TEXTURE. " +
  "Photographic skin with visible pores, fine vellus hair, subsurface scattering, natural specular highlights " +
  "on forehead, nose bridge and cheekbones, and realistic micro-imperfections — " +
  "never plastic, never waxy, never airbrushed, never over-smoothed, never AI-glossy. " +
  "Hair rendered strand by strand, with light transmitting through it and natural flyaways. " +
  "Fabric with real weave, weight, drape, wrinkles and stitching. " +
  "Correct micro-detail on eyes (wet catchlight matching the scene's actual light source), teeth, nails, jewelry and skin folds. " +

  "STEP I · CAMERA MATCH. " +
  "Match the original photograph's resolution, sharpness level, grain or sensor-noise signature, chromatic behaviour " +
  "and compression character. The added person must never look cleaner, sharper, brighter or higher-resolution " +
  "than the rest of the photograph — that mismatch is the most common giveaway and is forbidden. " +

  "STEP J · FINAL VERIFICATION BEFORE DELIVERY. " +
  "The result must be indistinguishable from a real photograph of these people standing together. " +
  "Verify one by one: light direction matches, shadow direction and softness match, color temperature matches, " +
  "scale is plausible, perspective and eye level align, depth of field matches, texture and grain match, " +
  "and the original subject is still 100% untouched. " +
  "If any of these checks fails, correct it before delivering the image. ";

// Detecte une demande d'ajout de personne meme quand le nom n'est pas dans la
// base de celebrites (« ajoute quelqu'un a cote de moi », « avec mon frere »...).
// Sert a appliquer ADDED_PERSON_INTEGRATION dans tous les cas, pour tous les plans.
const PERSON_ADDITION_RE = new RegExp(
  [
    "\\bajoute[rz]?\\s+(?:une?\\s+|le\\s+|la\\s+|l')?(?:personne|homme|femme|mec|gars|fille|ami|amie|copain|copine|acteur|actrice|chanteur|chanteuse|joueur|joueuse|rappeur|rappeuse|mod[eè]le|c[eé]l[eé]brit[eé])",
    "\\badd\\s+(?:a\\s+|an\\s+|the\\s+)?(?:person|man|woman|guy|girl|friend|celebrity|someone)",
    "(?:^|[^\\w])[aà]\\s*c[oô]t[eé]\\s+de\\s+(?:moi|nous)\\b",
    "\\bnext\\s+to\\s+(?:me|us)\\b",
    "\\bbeside\\s+(?:me|us)\\b",
    "\\balongside\\s+(?:me|us)\\b",
    "\\bc[oô]te\\s*[aà]\\s*c[oô]te\\b",
    "\\bside\\s+by\\s+side\\b",
    "\\bpose\\s*-?\\s*(?:toi|moi)\\s+avec\\b",
    "\\bavec\\s+(?:mon|ma|mes)\\s+\\w+",
    "\\bdeuxi[eè]me\\s+personne\\b",
    "\\bsur\\s+la\\s+photo\\s+avec\\b",
  ].join("|"),
  "i",
);

function isPersonAdditionRequest(text: string): boolean {
  return PERSON_ADDITION_RE.test(text ?? "");
}

// ─── PROMPT BUILDER ───────────────────────────────────────────────────────────
//
// For img2img: the person comes FROM the image — prompt describes the
// target scene/style only. No person description needed.

function buildStylePrompt(
  customPrompt:    string,
  stylePrompt:     string,
  renderStyle?:    string,
  intensity?:      string,
  preserveOutfit?: boolean,
  celebRefCount?:  number,
): { positive: string; negative: string } {
  const translated = translateToEnglish(customPrompt.trim());
  const style      = stylePrompt.trim();
  const renderDesc = RENDER_STYLE_PROMPTS[renderStyle ?? ""] ?? "";
  const outfitRule = preserveOutfit
    ? " Keep the person's current clothing and outfit completely unchanged."
    : "";
  const renderRule   = renderDesc ? ` Render style: ${renderDesc}.` : "";
  const intensityPfx: Record<string, string> = {
    light:  "Subtly and minimally:",
    strong: "Boldly and dramatically:",
  };
  const prefix      = intensityPfx[intensity ?? ""] ?? "";
  const hasRefImages = (celebRefCount ?? 0) > 0;

  // ── Detect celebrities in the full text ─────────────────────────────────
  const celebs = findAllCelebrities(customPrompt + " " + stylePrompt);

  // Ajout d'une personne demande ? (celebrite reconnue OU formulation du type
  // « ajoute X a cote de moi »). Independant du plan : la meme detection et les
  // memes regles d'integration s'appliquent en free, essentiel, pro et ultra.
  const isPersonAddition =
    celebs.length > 0
    || isPersonAdditionRequest(customPrompt)
    || isPersonAdditionRequest(translated)
    || isPersonAdditionRequest(style);

  let editInstruction: string;

  // Exigence de rendu commune aux deux branches ci-dessous (avec ou sans photos
  // de reference), donc identique quel que soit l'abonnement de l'utilisateur.
  const ADD_REALISM_LINE =
    "Integrate them physically into the existing photo: same light direction and light color as image 1, " +
    "matching shadows on the ground, same camera angle, eye level and perspective, correct height and scale, " +
    "body and gaze orientation coherent with the original subject and the camera, " +
    "full three-dimensional volume (never a flat cut-out), and photorealistic skin, hair and fabric texture. ";

  if (celebs.length > 0) {
    const celebNames = celebs.map((c) => c.name).join(" and ");

    const sceneExtra = [translated, style]
      .filter(Boolean)
      .map((s) => s.replace(new RegExp(celebs.map((c) => c.name).join("|"), "gi"), "").trim())
      .filter(Boolean)
      .join(", ");

    if (hasRefImages) {
      // ── CELEBRITY INSERTION — VISUAL ANALYSIS MODE ──────────────────────
      // Reference images of the celebrity are in image_input[1], [2], [3]...
      // Nano-banana-pro (Gemini-based) can visually analyse multiple images.
      // The prompt tells it: study the reference photos, then reproduce that
      // person's appearance accurately in the scene.
      // The text description is also provided as a cross-check to catch cases
      // where the reference photos alone are insufficient.
      const n = celebRefCount!;
      const imgWord = n === 1 ? "image" : "images";
      const celebDescBlock = celebs
        .map((c) => `[${c.name.toUpperCase()}] ${c.visual_description}`)
        .join(" | ");

      editInstruction =
        `You are given ${n + 1} images. ` +
        `Image 1 is the MAIN PHOTO — this is the user's photo and must remain 100% unchanged. ` +
        `${n === 1 ? "Image 2 is" : `Images 2 to ${n + 1} are`} real reference ${imgWord} of ${celebNames} — ` +
        `these are provided ONLY as visual identity references for rendering ${celebNames} accurately. ` +

        `STEP 1 — VISUAL ANALYSIS: Study the reference ${imgWord} of ${celebNames} carefully. ` +
        `Identify and memorise: ` +
        `their exact face shape and features (jawline, nose, eyes, eyebrows, lips, forehead), ` +
        `their precise skin tone and texture, ` +
        `their hair (exact color, cut, texture, style), ` +
        `their body type and proportions, ` +
        `any visible tattoos, scars or distinctive marks, ` +
        `their signature clothing style and aesthetic. ` +

        `STEP 2 — GENERATION: Add ${celebNames} to image 1 as a new person standing naturally beside the existing subject. ` +
        `Reproduce ${celebNames}'s appearance EXACTLY as observed in the reference ${imgWord} — ` +
        `same face, same skin tone, same hair, same body. ` +
        `Do NOT invent generic features. ` +
        `Use what you see in the reference ${imgWord} as primary truth. ` +

        `STEP 3 — IDENTITY CROSS-CHECK: Verify that the rendered ${celebNames} also matches ` +
        `their documented known appearance: ${celebDescBlock}. ` +
        `The rendered person must be consistent with both the reference photos and this description. ` +
        `If there is any conflict, trust the reference photos. ` +
        `Never render a generic or placeholder face — always the real person. ` +

        `STEP 4 — PHYSICAL INTEGRATION: ${ADD_REALISM_LINE}` +

        `${sceneExtra ? `Scene context: ${sceneExtra}. ` : ""}` +
        `The original person in image 1 stays 100% unchanged, pixel-perfect. ` +
        `The base image itself stays unchanged: same background, same decor, same framing, same colors, same light. ` +
        `Do not alter, resize, reposition, or redraw the person from image 1 in any way. ` +
        `The ONLY difference between image 1 and your output is the presence of ${celebNames}.`;

    } else {
      // ── CELEBRITY INSERTION — DESCRIPTION-GUIDED (no reference photos) ──
      const celebDataBlock = celebs.map((c) =>
        `[${c.name.toUpperCase()}] ${c.visual_description}`,
      ).join(" | ");

      editInstruction =
        `TASK — ADD ${celebNames.toUpperCase()} TO THIS PHOTO: ` +
        `Insert ${celebNames} as a new person standing naturally beside the original subject. ` +
        `CELEBRITY APPEARANCE (use this as your rendering specification): ${celebDataBlock}. ` +
        `Render ${celebNames} using their authentic, real, documented face — ` +
        `draw on all training knowledge of this public figure combined with the description above. ` +
        `Do NOT invent a generic face. Do NOT use a placeholder. Render the real person. ` +
        `PHYSICAL INTEGRATION: ${ADD_REALISM_LINE}` +
        `${sceneExtra ? `Scene: ${sceneExtra}. ` : ""}` +
        `The original person in this photo stays 100% unchanged — ` +
        `do not alter, resize, reposition, or redraw them in any way. ` +
        `The base image itself stays unchanged: same background, same decor, same framing, same colors, same light. ` +
        `The ONLY difference between the input photo and your output is the presence of ${celebNames}.`;
    }
  } else {
    // ── STANDARD STYLE / SCENE TRANSFORMATION ───────────────────────────
    const sceneDesc = [translated, style].filter(Boolean).join(", ")
      || "professional portrait with perfect lighting";
    editInstruction = [prefix, sceneDesc].filter(Boolean).join(" ").trim()
      || "Enhance the photo quality and lighting.";
  }

  // Ordre volontaire (identique pour TOUTES les formules) :
  //   1. verrou absolu sur l'image de base
  //   2. la tache demandee par l'utilisateur
  //   3. la specification d'integration physique de la personne ajoutee
  //   4. le contrat systeme complet
  const positive =
    BASE_IMAGE_LOCK +
    `TASK — ${editInstruction}.${renderRule}${outfitRule} ` +
    (isPersonAddition ? ADDED_PERSON_INTEGRATION : "") +
    HIDDEN_SYSTEM_CONTEXT;

  return { positive, negative: NEG };
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
// La résolution de SORTIE dépend de l'intensité choisie (et non plus seulement
// du plan), afin de réduire le coût des rendus doux. Le modèle de génération
// (google/nano-banana-pro) ne change pas : seul le paramètre `resolution` varie.
//
//   light / moderate (Légère / Modérée) → plafonnée à 2K, jamais 4K → moins cher
//   strong / ultra   (Intense / Ultra)  → 4K
function intensityToResolution(tierResolution: string, intensity?: string): string {
  switch (intensity) {
    case "strong":
    case "ultra":
      return "4K";
    case "light":
    case "moderate":
    default:
      // Ne jamais dépasser 2K pour les intensités douces (4K → 2K).
      return tierResolution === "4K" ? "2K" : tierResolution;
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
    return replicate.predictions.create({ version: spec.substring(colonIdx + 1), input });
  }
  return replicate.predictions.create({ model: spec, input });
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

  // ── nano-banana-pro (style / scene transformation) ───────────────────────
  const qs       = QUALITY_SETTINGS[tier];
  const maxRefs  = qs.maxRefImages;

  // Clip celeb reference images to the tier's allowed maximum
  const clippedRefUrls  = (input.celebRefImageUrls ?? []).slice(0, maxRefs);
  const clippedRefCount = Math.min(input.celebRefCount ?? 0, maxRefs);

  // buildStylePrompt applique BASE_IMAGE_LOCK + ADDED_PERSON_INTEGRATION a
  // toutes les generations, quel que soit `tier` : aucune regle n'est retiree
  // pour les formules moins cheres.
  const { positive, negative } = buildStylePrompt(
    input.customPrompt ?? "",
    input.stylePrompt  ?? "",
    input.renderStyle,
    input.transformIntensity,
    input.preserveOutfit ?? false,
    clippedRefCount,
  );

  return {
    mode:               "style",
    qualityTier:        tier,
    prompt:             positive,
    negPrompt:          negative,
    inputImageUrl:      input.inputImageUrl,
    strength:           intensityToStrength(input.transformIntensity),
    modelIndex:         0,
    resolution:         intensityToResolution(qs.resolution, input.transformIntensity),
    outputFormat:       qs.format,
    allowFallback:      qs.allowFallback,
    aspectRatio:        input.aspectRatio,
    celebRefImageUrl:   clippedRefUrls[0],
    celebRefImageUrls:  clippedRefUrls,
    celebRefCount:      clippedRefCount,
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
      config.negPrompt    ?? NEG,
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
