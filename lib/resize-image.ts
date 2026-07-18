const MAX_DIMENSION = 1200;

// Ratios supportés par google/nano-banana-pro (valeur décimale = largeur / hauteur).
const SUPPORTED_ASPECT_RATIOS: { label: string; value: number }[] = [
  { label: "9:16", value: 9 / 16 },
  { label: "2:3",  value: 2 / 3  },
  { label: "3:4",  value: 3 / 4  },
  { label: "4:5",  value: 4 / 5  },
  { label: "1:1",  value: 1      },
  { label: "5:4",  value: 5 / 4  },
  { label: "4:3",  value: 4 / 3  },
  { label: "3:2",  value: 3 / 2  },
  { label: "16:9", value: 16 / 9 },
  { label: "21:9", value: 21 / 9 },
];

/**
 * Détermine le ratio d'aspect supporté le plus proche de la photo uploadée,
 * afin que l'image de sortie conserve l'orientation (vertical / carré / horizontal)
 * de la photo d'entrée. On passe une valeur explicite au modèle plutôt que
 * "match_input_image", peu fiable dès qu'on ajoute des images de référence.
 */
export async function getSupportedAspectRatio(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = img.width / img.height;
      let best = SUPPORTED_ASPECT_RATIOS[0]!;
      let bestDiff = Infinity;
      for (const r of SUPPORTED_ASPECT_RATIOS) {
        const diff = Math.abs(r.value - ratio);
        if (diff < bestDiff) { bestDiff = diff; best = r; }
      }
      resolve(best.label);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve("1:1"); };
    img.src = url;
  });
}

export async function resizeImageFile(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        resolve(file);
        return;
      }
      if (width >= height) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Canvas resize failed")); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}
