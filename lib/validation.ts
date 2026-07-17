const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File, maxSizeBytes: number): ValidationResult {
  if (!file) {
    return { valid: false, error: "Fichier manquant" };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Format non supporté: ${file.type}. Utilisez JPG, PNG ou WebP.`,
    };
  }

  if (file.size > maxSizeBytes) {
    const maxMB = maxSizeBytes / (1024 * 1024);
    return {
      valid: false,
      error: `Fichier trop lourd. Maximum ${maxMB}MB.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: "Fichier vide" };
  }

  return { valid: true };
}

const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export function validateVideoFile(file: File, maxSizeBytes: number): ValidationResult {
  if (!file) {
    return { valid: false, error: "Fichier manquant" };
  }

  if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Format non supporté: ${file.type}. Utilisez MP4, MOV ou WebM.`,
    };
  }

  if (file.size > maxSizeBytes) {
    const maxMB = maxSizeBytes / (1024 * 1024);
    return {
      valid: false,
      error: `Vidéo trop lourde. Maximum ${maxMB}MB.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: "Fichier vide" };
  }

  return { valid: true };
}

export function validateApiKey(req: { headers: { get: (key: string) => string | null } }): boolean {
  const apiKey = req.headers.get("x-api-key");
  return apiKey === process.env.API_SECRET_KEY;
}
