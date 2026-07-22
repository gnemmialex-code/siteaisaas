import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase";
import {
  buildAsyncJobConfig,
  startAsyncJob,
  type AsyncJobConfig,
  type PipelineInput,
} from "@/scripts/pipeline";
import { validateImageFile, validateVideoFile } from "@/lib/validation";
import { uploadToStorage } from "@/lib/storage";
import { findAllCelebrities, CELEBRITY_DB } from "@/lib/celebrity-db";
import { getCelebRefImages } from "@/lib/celebrity-refs";
import { isPaidPlan } from "@/lib/plan";

export const maxDuration = 60;

const MAX_FILE_SIZE  = 30 * 1024 * 1024;
const MAX_VIDEO_SIZE = 70 * 1024 * 1024;
const BUCKET         = "celebswap-images";

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function planToTier(planId?: string | null): "free" | "essentiel" | "pro" | "ultra" {
  if (!planId) return "essentiel";
  const p = planId.toLowerCase();
  if (p.includes("ultra") || p.includes("elite")) return "ultra";
  if (p.includes("pro")) return "pro";
  return "essentiel";
}

async function getUserPlanId(userId: string): Promise<string> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("users")
    .select("plan_id")
    .eq("id", userId)
    .single();
  if (error || !data?.plan_id) return "plan_essentiel";
  return data.plan_id;
}

async function uploadFile(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  file: File,
  userId: string,
): Promise<{ url: string; b64: string }> {
  const validation = validateImageFile(file, MAX_FILE_SIZE);
  if (!validation.valid) throw new Error(validation.error);

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext    = file.name.split(".").pop() ?? "jpg";
  const path   = `inputs/${userId}/${generateId()}.${ext}`;
  const url    = await uploadToStorage(supabase, buffer, path, file.type);
  const b64    = `data:${file.type};base64,${buffer.toString("base64")}`;
  return { url, b64 };
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const mode = (formData.get("mode") as string) ?? "style";

  // ── Accès payant : le rendu NET (vraie génération IA) est réservé aux
  // abonnements actifs. Anonyme + plan "free" → APERÇU flouté géré côté client
  // (aucun appel Replicate, aucun crédit). Le serveur le garantit ici pour que
  // même un appel direct à l'API ne puisse pas déclencher de génération payante.
  let qualityTier: "free" | "essentiel" | "pro" | "ultra" = "free";
  let planId: string | null = null;

  if (userId) {
    planId      = await getUserPlanId(userId);
    qualityTier = planToTier(planId);
  }

  if (!isPaidPlan(planId)) {
    return NextResponse.json({ preview: true });
  }

  // ── Restrictions par plan ──────────────────────────────────────────────────
  // Vidéo IA : plan Ultra uniquement. SwapFace : plan Pro ou Ultra.
  if (mode === "video" && qualityTier !== "ultra") {
    return NextResponse.json(
      { error: "La génération vidéo est réservée au plan Ultra. Passez à Ultra pour y accéder.", upgrade: true },
      { status: 403 }
    );
  }
  if (mode === "swapface" && qualityTier !== "pro" && qualityTier !== "ultra") {
    return NextResponse.json(
      { error: "Le SwapFace est réservé aux plans Pro et Ultra. Passez à Pro pour y accéder.", upgrade: true },
      { status: 403 }
    );
  }

  const effectiveUserId = userId ?? "anon";

  // ── Options de génération ──────────────────────────────────────────────────
  const renderStyle        = (formData.get("render_style")    as string | null) ?? undefined;
  const transformIntensity = (formData.get("intensity")       as string | null) ?? "moderate";
  const preserveOutfit     = (formData.get("preserve_outfit") as string | null) === "1";

  try {
    const generationId = generateId();
    let styleLabel: string;
    let inputImageForRecord = "";
    let predictionId: string;
    let jobConfig: AsyncJobConfig;

    if (mode === "swapface") {
      // ── SWAPFACE ──────────────────────────────────────────────────────────
      const sourceFile = formData.get("source_image") as File | null;
      const targetFile = formData.get("target_image") as File | null;
      if (!sourceFile || !targetFile) {
        return NextResponse.json({ error: "Images source et cible requises" }, { status: 400 });
      }
      const [src, tgt] = await Promise.all([
        uploadFile(supabase, sourceFile, effectiveUserId),
        uploadFile(supabase, targetFile, effectiveUserId),
      ]);
      inputImageForRecord = src.url;
      styleLabel          = "SwapFace";

      jobConfig    = buildAsyncJobConfig({ mode: "swapface", qualityTier } as PipelineInput, src.b64);
      predictionId = await startAsyncJob(jobConfig, tgt.b64);

    } else if (mode === "style") {
      // ── STYLE IA ──────────────────────────────────────────────────────────
      const imageFile      = formData.get("image")        as File | null;
      const styleId        = formData.get("style_id")     as string | null;
      const rawStylePrompt = formData.get("style_prompt") as string | null;
      const customPrompt   = (formData.get("custom_prompt") as string) ?? "";
      const aspectRatio    = (formData.get("aspect_ratio")  as string | null) ?? undefined;
      styleLabel           = (formData.get("style_label") as string) ?? "Génération IA";

      if (!imageFile) {
        return NextResponse.json({ error: "Photo requise" }, { status: 400 });
      }
      if (!rawStylePrompt && !customPrompt.trim()) {
        return NextResponse.json({ error: "Veuillez choisir un style ou entrer une description" }, { status: 400 });
      }

      const stylePrompt = rawStylePrompt
        || "photorealistic portrait, ultra HD, professional photography, perfect lighting";

      const { url: inputImageUrl, b64: sourceB64 } = await uploadFile(supabase, imageFile, effectiveUserId);
      inputImageForRecord = inputImageUrl;

      // Detect celebrities in the prompt and load their reference images from Storage
      const detectedCelebs = findAllCelebrities((customPrompt ?? "") + " " + (stylePrompt ?? ""));
      const primaryCeleb   = detectedCelebs[0];

      let celebRefImageUrls: string[] = [];
      let celebRefImageUrl: string | undefined;

      if (primaryCeleb) {
        celebRefImageUrls = await getCelebRefImages(
          primaryCeleb.id,
          primaryCeleb.reference_images ?? [],
          primaryCeleb.reference_image_url,
        );
        celebRefImageUrl = celebRefImageUrls[0];
        if (celebRefImageUrls.length > 0) {
          console.log(`[Generate] ${primaryCeleb.name}: ${celebRefImageUrls.length} reference image(s) loaded`);
        }
      }

      const pipelineInput: PipelineInput = {
        mode:              "style",
        inputImageUrl,
        styleId:           styleId ?? "custom",
        stylePrompt,
        customPrompt,
        qualityTier,
        renderStyle,
        transformIntensity,
        preserveOutfit,
        aspectRatio,
        celebRefImageUrl,
        celebRefImageUrls,
        celebRefCount:  celebRefImageUrls.length,
        celebName:      primaryCeleb?.name,
        celebGender:    primaryCeleb?.gender,
      };

      jobConfig    = buildAsyncJobConfig(pipelineInput, sourceB64);
      predictionId = await startAsyncJob(jobConfig);

    } else if (mode === "video") {
      // ── VIDÉO IA (Seedance 2.0 Fast) ──────────────────────────────────────
      const videoUrlInput = ((formData.get("video_url") as string) ?? "").trim();
      const videoFile     = formData.get("video")  as File | null;
      const videoPrompt   = ((formData.get("prompt") as string) ?? "").trim();
      let   objectOptions: string[] = [];
      try { objectOptions = JSON.parse((formData.get("object_options") as string) ?? "[]"); }
      catch { /* options optionnelles */ }

      if (!videoPrompt) return NextResponse.json({ error: "Prompt requis" }, { status: 400 });

      // La vidéo arrive normalement via upload direct Supabase (video_url) —
      // la limite de corps de requête Vercel (~4,5 Mo) interdit les gros fichiers
      // par l'API. Le champ fichier reste accepté en secours (petites vidéos).
      let videoUrl: string;

      if (videoUrlInput) {
        let parsed: URL | null = null;
        try { parsed = new URL(videoUrlInput); } catch { /* invalide */ }
        const supaHost = process.env.NEXT_PUBLIC_SUPABASE_URL
          ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
          : "";
        if (!parsed || !supaHost || parsed.host !== supaHost) {
          return NextResponse.json({ error: "URL vidéo invalide" }, { status: 400 });
        }
        videoUrl = videoUrlInput;
      } else if (videoFile) {
        const videoValidation = validateVideoFile(videoFile, MAX_VIDEO_SIZE);
        if (!videoValidation.valid) {
          return NextResponse.json({ error: videoValidation.error }, { status: 400 });
        }
        const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
        const videoExt    = videoFile.name.split(".").pop() ?? "mp4";
        const videoPath   = `inputs/${effectiveUserId}/${generateId()}.${videoExt}`;
        videoUrl          = await uploadToStorage(supabase, videoBuffer, videoPath, videoFile.type);
      } else {
        return NextResponse.json({ error: "Vidéo requise" }, { status: 400 });
      }

      inputImageForRecord = videoUrl;
      styleLabel          = "Vidéo IA";

      // Montre choisie dans le sélecteur (prioritaire) + montres / célébrités
      // détectées dans le prompt → photos de référence Supabase (bucket
      // celebrity-refs). Seedance accepte jusqu'à 9 images.
      const watchId       = (formData.get("watch_id") as string | null) ?? "";
      const selectedWatch = watchId ? CELEBRITY_DB.find((c) => c.id === watchId) : undefined;

      const detectedEntities = [
        ...(selectedWatch ? [selectedWatch] : []),
        ...findAllCelebrities(videoPrompt).filter((c) => c.id !== watchId),
      ].slice(0, 3);
      const refImageUrls: string[] = [];
      const refEntities: { name: string; visual_description: string; refCount: number; wear?: boolean }[] = [];

      for (const entity of detectedEntities) {
        const wear = entity.id === watchId || undefined;
        const remaining = 9 - refImageUrls.length;
        if (remaining <= 0) {
          refEntities.push({ name: entity.name, visual_description: entity.visual_description, refCount: 0, wear });
          continue;
        }
        const urls = (await getCelebRefImages(
          entity.id,
          entity.reference_images ?? [],
          entity.reference_image_url,
        )).slice(0, remaining);
        refImageUrls.push(...urls);
        refEntities.push({
          name:               entity.name,
          visual_description: entity.visual_description,
          refCount:           urls.length,
          wear,
        });
        if (urls.length > 0) {
          console.log(`[Generate] Vidéo IA — ${entity.name}: ${urls.length} reference image(s) loaded`);
        }
      }

      const pipelineInput: PipelineInput = {
        mode:               "video",
        videoUrl,
        customPrompt:       videoPrompt,
        videoObjectOptions: objectOptions,
        videoRefEntities:   refEntities,
        celebRefImageUrls:  refImageUrls,
        celebRefCount:      refImageUrls.length,
        qualityTier,
      };

      jobConfig    = buildAsyncJobConfig(pipelineInput, "");
      predictionId = await startAsyncJob(jobConfig);

    } else {
      return NextResponse.json({ error: "Ce mode n'est pas encore disponible" }, { status: 400 });
    }

    // ── Sauvegarder le job (abonné payant = générations illimitées) ─────────
    {
      const { error: insertError } = await supabase.from("generations").insert({
        id:               generationId,
        user_id:          userId,
        input_image_url:  inputImageForRecord,
        output_image_url: "",
        style:            styleLabel,
        status:           "pending",
        prediction_id:    predictionId,
        step:             1,
        job_config:       jobConfig,
      });

      if (insertError) {
        console.error("[Generate] DB insert error:", insertError.message);
        throw new Error(`Erreur DB : ${insertError.message}`);
      }

      // Auto-delete oldest done generations based on plan limit
      const HISTORY_LIMITS: Record<string, number> = {
        free:      10,
        essentiel: 20,
        pro:       100,
        ultra:     999,
      };
      const historyLimit = HISTORY_LIMITS[qualityTier] ?? 20;

      const { data: doneGens } = await supabase
        .from("generations")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "done")
        .order("created_at", { ascending: false });

      if (doneGens && doneGens.length > historyLimit) {
        const toDelete = doneGens.slice(historyLimit).map((g: { id: string }) => g.id);
        await supabase.from("generations").delete().in("id", toDelete).eq("user_id", userId);
      }
    }

    return NextResponse.json({ job_id: generationId, prediction_id: predictionId });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur pipeline IA";
    console.error("[Generate] Error:", msg);

    if (msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("throttled")) {
      return NextResponse.json(
        { error: "Limite d'API Replicate atteinte — réessayez dans 30 secondes" },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const { data: generation, error } = await supabase
    .from("generations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !generation) {
    return NextResponse.json({ error: "Génération introuvable" }, { status: 404 });
  }

  return NextResponse.json(generation);
}
