// ─────────────────────────────────────────────────────────────────────────────
// Linkvertise — crédits offerts
//
// Principe : l'utilisateur connecté part sur un lien Linkvertise, effectue les
// étapes, puis Linkvertise le renvoie sur notre lien de destination en ajoutant
// ?hash=<...> à l'URL. Ce hash n'est valable que quelques secondes et une seule
// fois : on le vérifie côté serveur auprès de l'API anti-bypass avant de
// créditer le compte. Sans cette vérification, n'importe qui pourrait ouvrir
// l'URL de retour directement et se créditer à l'infini.
// ─────────────────────────────────────────────────────────────────────────────

const ANTI_BYPASS_ENDPOINT = "https://publisher.linkvertise.com/api/v1/anti_bypassing";

/** Crédits versés à chaque validation. */
export const LINKVERTISE_REWARD = Number(process.env.LINKVERTISE_REWARD_CREDITS ?? 100);

/** Nombre maximum de validations récompensées par utilisateur sur 24 h. */
export const LINKVERTISE_DAILY_MAX = Number(process.env.LINKVERTISE_DAILY_MAX ?? 3);

/** Durée de vie d'un ticket (minutes) entre le départ et le retour. */
export const LINKVERTISE_TICKET_TTL_MIN = 60;

/** Nom du cookie qui transporte le ticket pendant l'aller-retour. */
export const LINKVERTISE_COOKIE = "lv_ticket";

/** Page qui affiche le résultat de l'opération. */
export const LINKVERTISE_RETURN_PAGE = "/credits-gratuits";

/** Cookie qui mémorise d'où l'utilisateur est parti (page publique ou Dashboard). */
export const LINKVERTISE_FROM_COOKIE = "lv_from";

/** Page de retour selon l'origine du clic. */
export function linkvertiseReturnPath(from: string | null | undefined): string {
  return from === "dashboard" ? "/dashboard?view=freecredits" : LINKVERTISE_RETURN_PAGE;
}

export function linkvertiseConfigured(): boolean {
  return !!process.env.LINKVERTISE_ANTI_BYPASS_TOKEN &&
         !!(process.env.LINKVERTISE_LINK || process.env.LINKVERTISE_USER_ID);
}

/**
 * URL Linkvertise vers laquelle envoyer l'utilisateur.
 *
 * • Mode simple (recommandé) : LINKVERTISE_LINK contient le lien créé dans le
 *   dashboard Linkvertise, dont la destination est /api/linkvertise/callback.
 * • Mode dynamique (optionnel) : si LINKVERTISE_USER_ID est défini, on fabrique
 *   le lien à la volée avec la destination encodée en base64, ce qui permet de
 *   glisser le ticket dans l'URL de retour (utile si les cookies sont perdus,
 *   par exemple dans les navigateurs intégrés aux applis mobiles).
 */
export function buildLinkvertiseUrl(ticket: string, origin: string): string {
  const userId = process.env.LINKVERTISE_USER_ID;

  if (userId) {
    const target = `${origin}/api/linkvertise/callback/${ticket}`;
    const random = (Math.random() * 1000).toFixed(7);
    const encoded = Buffer.from(encodeURI(target), "utf8").toString("base64");
    return `https://link-to.net/${userId}/${random}/dynamic?r=${encodeURIComponent(encoded)}`;
  }

  return process.env.LINKVERTISE_LINK!;
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "missing_hash" | "not_configured" | "invalid_token" | "invalid_hash" | "network" };

/**
 * Vérifie un hash auprès de l'API anti-bypass Linkvertise.
 * Le hash est détruit côté Linkvertise dès la première vérification réussie.
 */
export async function verifyLinkvertiseHash(hash: string | null): Promise<VerifyResult> {
  if (!hash) return { ok: false, reason: "missing_hash" };

  const token = process.env.LINKVERTISE_ANTI_BYPASS_TOKEN;
  if (!token) return { ok: false, reason: "not_configured" };

  let body: string;
  try {
    const res = await fetch(`${ANTI_BYPASS_ENDPOINT}?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ hash }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    body = (await res.text()).trim();
  } catch (err) {
    console.error("[linkvertise] appel anti-bypass impossible:", err);
    return { ok: false, reason: "network" };
  }

  // Réponses observées : "TRUE" / "FALSE" / "Invalid token." — et, selon les
  // versions, un JSON { "status": true }. On accepte les deux formes.
  const plain = body.replace(/^"|"$/g, "").toLowerCase();
  if (plain === "true") return { ok: true };
  if (plain === "false") return { ok: false, reason: "invalid_hash" };
  if (plain.includes("invalid token")) {
    console.error("[linkvertise] token anti-bypass refusé par l'API");
    return { ok: false, reason: "invalid_token" };
  }

  try {
    const json = JSON.parse(body) as { status?: unknown; success?: unknown };
    if (json.status === true || json.success === true) return { ok: true };
    if (typeof json.status === "string" && json.status.toLowerCase() === "true") return { ok: true };
  } catch { /* réponse non-JSON */ }

  console.error("[linkvertise] réponse anti-bypass inattendue:", body.slice(0, 200));
  return { ok: false, reason: "invalid_hash" };
}

/** Adresse IP de l'appelant (journalisation anti-abus). */
export function clientIp(headers: Headers): string | null {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip");
}
