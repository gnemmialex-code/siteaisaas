import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase";
import {
  advanceAsyncJob,
  startAsyncJob,
  replicate,
  type AsyncJobConfig,
  STYLE_MODEL_COUNT,
} from "@/scripts/pipeline";

export const maxDuration = 45;

const SWITCHING_PREFIX = "switching:";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId        = searchParams.get("job_id");
  const predictionId = searchParams.get("prediction_id"); // anonymous users

  // ── Anonymous: direct prediction check (single step) ──────────────────────
  if (!jobId && predictionId) {
    try {
      const pred = await replicate.predictions.get(predictionId);
      if (pred.status === "starting" || pred.status === "processing") {
        return NextResponse.json({ status: "pending", step: 1 });
      }
      if (pred.status === "failed" || pred.status === "canceled") {
        return NextResponse.json({ status: "error", error: String(pred.error ?? "Génération échouée") });
      }
      const output = Array.isArray(pred.output) ? pred.output[0] : pred.output;
      return NextResponse.json({ status: "done", output_image_url: String(output) });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      return NextResponse.json({ status: "error", error: msg }, { status: 500 });
    }
  }

  if (!jobId) {
    return NextResponse.json({ error: "job_id manquant" }, { status: 400 });
  }

  // ── Authenticated: DB-backed pipeline ─────────────────────────────────────
  const supabase = await createSupabaseServer();
  // La table generations n'a pas de policy UPDATE : les ecritures passent par
  // le client admin. La lecture ci-dessous (client utilisateur, RLS) garantit
  // que le job appartient bien a l'utilisateur connecte.
  const admin    = createSupabaseAdmin();

  const { data: job } = await supabase
    .from("generations")
    .select("id, status, prediction_id, step, job_config, output_image_url")
    .eq("id", jobId)
    .single();

  if (!job) {
    return NextResponse.json({ status: "error", error: "Job introuvable" });
  }

  if (job.status === "done") {
    return NextResponse.json({ status: "done", output_image_url: job.output_image_url });
  }
  if (job.status === "error") {
    return NextResponse.json({ status: "error", error: "La génération a échoué" });
  }

  // Un autre appel /poll est en train de lancer le modele de secours.
  if (String(job.prediction_id ?? "").startsWith(SWITCHING_PREFIX)) {
    return NextResponse.json({ status: "pending", step: job.step });
  }

  // Check current prediction
  let pred;
  try {
    pred = await replicate.predictions.get(job.prediction_id as string);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Replicate error";
    await admin.from("generations").update({ status: "error" }).eq("id", jobId);
    return NextResponse.json({ status: "error", error: msg });
  }

  if (pred.status === "starting" || pred.status === "processing") {
    return NextResponse.json({ status: "pending", step: job.step });
  }

  // ── Prediction failed — try next model in fallback chain (style mode only) ─
  if (pred.status === "failed" || pred.status === "canceled") {
    const jobConfig = job.job_config as AsyncJobConfig;

    let errMsg = String(pred.error ?? "Génération échouée");

    // E005 = refus du filtre de securite Google. Nano Banana Pro applique le
    // meme refus : relancer le secours couterait du temps et des credits pour
    // rien. On renvoie directement un message clair.
    const isSafetyBlock = /\bE005\b|flagged as sensitive/i.test(errMsg);
    if (isSafetyBlock) {
      errMsg = "Cette demande a été refusée par le filtre de sécurité du modèle IA (contenu jugé sensible). " +
               "Essayez une autre formulation ou une autre photo.";
    }

    if (jobConfig?.mode === "style" && !isSafetyBlock) {
      const nextIdx = (jobConfig.modelIndex ?? 0) + 1;
      if (nextIdx < STYLE_MODEL_COUNT) {
        // Verrou : le navigateur peut lancer plusieurs /poll en parallele. Seul
        // celui qui remplace l'ancien prediction_id lance le secours ; les
        // autres repondent "pending" au lieu de marquer le job en erreur.
        const { data: claimed } = await admin
          .from("generations")
          .update({ prediction_id: `${SWITCHING_PREFIX}${job.prediction_id}` })
          .eq("id", jobId)
          .eq("prediction_id", job.prediction_id)
          .select("id");
        if (!claimed || claimed.length === 0) {
          return NextResponse.json({ status: "pending", step: job.step });
        }

        console.log(`[Poll] Model [${jobConfig.modelIndex ?? 0}] failed — trying model [${nextIdx}]`);
        const newConfig: AsyncJobConfig = { ...jobConfig, modelIndex: nextIdx };
        try {
          const newPredId = await startAsyncJob(newConfig);
          await admin.from("generations").update({
            prediction_id: newPredId,
            job_config:    newConfig,
            step:          1,
          }).eq("id", jobId);
          return NextResponse.json({ status: "pending", step: 1 });
        } catch (retryErr) {
          console.error("[Poll] Fallback start failed:", retryErr instanceof Error ? retryErr.message : retryErr);
          errMsg = retryErr instanceof Error ? retryErr.message : errMsg;
          // fall through to error below
        }
      }
    }

    await admin.from("generations").update({ status: "error" }).eq("id", jobId);
    return NextResponse.json({ status: "error", error: errMsg });
  }

  // ── Prediction succeeded — advance pipeline ────────────────────────────────
  try {
    const result = await advanceAsyncJob(
      job.job_config as AsyncJobConfig,
      job.step as number,
      pred.output,
    );

    if (result.done) {
      await admin.from("generations").update({
        output_image_url: result.outputUrl,
        status:           "done",
        prediction_id:    null,
        job_config:       null,
      }).eq("id", jobId);
      return NextResponse.json({ status: "done", output_image_url: result.outputUrl });
    }

    await admin.from("generations").update({
      prediction_id: result.predictionId,
      step:          result.step,
    }).eq("id", jobId);

    return NextResponse.json({ status: "pending", step: result.step });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur pipeline";
    console.error("[Poll] Advance error:", msg);
    await admin.from("generations").update({ status: "error" }).eq("id", jobId);
    return NextResponse.json({ status: "error", error: msg });
  }
}
