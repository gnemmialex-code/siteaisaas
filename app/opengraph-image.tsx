import { ImageResponse } from "next/og";

/**
 * Image de partage 1200×630, servie sur /opengraph-image.
 * Next l'injecte automatiquement en og:image ET twitter:image pour toutes les
 * routes qui ne définissent pas la leur.
 *
 * Rendu par satori : uniquement des formes et du texte, aucune ressource
 * externe ni police distante, pour que la génération ne dépende pas du réseau.
 * (satori ne sait pas faire de background-clip:text — le dégradé violet → cyan
 * de la charte est donc porté par un liseré et des halos, pas par le texte.)
 */
export const alt = "AstraCrea — essayage virtuel de montres de luxe par IA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const VIOLET = "#8A2BE2";
const NEON = "#00E5FF";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          backgroundColor: "#0D0D0D",
          padding: "0 84px",
        }}
      >
        {/* Halo violet haut-gauche */}
        <div
          style={{
            position: "absolute",
            top: -220,
            left: -160,
            width: 620,
            height: 620,
            borderRadius: 620,
            backgroundImage: `radial-gradient(circle, rgba(138,43,226,0.55) 0%, rgba(138,43,226,0) 70%)`,
          }}
        />
        {/* Halo cyan bas-droite */}
        <div
          style={{
            position: "absolute",
            bottom: -260,
            right: -180,
            width: 640,
            height: 640,
            borderRadius: 640,
            backgroundImage: `radial-gradient(circle, rgba(0,229,255,0.32) 0%, rgba(0,229,255,0) 70%)`,
          }}
        />

        {/* Liseré dégradé à gauche */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: 10,
            backgroundImage: `linear-gradient(180deg, ${VIOLET} 0%, ${NEON} 100%)`,
          }}
        />

        {/* Marque */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 60,
              height: 60,
              borderRadius: 18,
              backgroundImage: `linear-gradient(135deg, ${VIOLET} 0%, ${NEON} 100%)`,
              fontSize: 36,
              fontWeight: 700,
              color: "#FFFFFF",
            }}
          >
            A
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#FFFFFF", letterSpacing: -0.5 }}>
            AstraCrea
          </div>
        </div>

        {/* Accroche */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 68,
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1.12,
            letterSpacing: -2,
          }}
        >
          <div style={{ display: "flex" }}>Les montres de luxe</div>
          <div style={{ display: "flex" }}>les plus rares au poignet</div>
        </div>

        <div style={{ display: "flex", fontSize: 31, color: "rgba(255,255,255,0.6)", marginTop: 28 }}>
          Envoyez une photo — rendu 4K en moins de 30 secondes.
        </div>

        {/* Bandeaux de qualification */}
        <div style={{ display: "flex", gap: 14, marginTop: 46 }}>
          {["Essayage virtuel par IA", "Ultra 4K", "Moins de 30 s"].map((tag) => (
            <div
              key={tag}
              style={{
                display: "flex",
                fontSize: 23,
                color: "rgba(255,255,255,0.82)",
                padding: "11px 24px",
                borderRadius: 999,
                border: "1px solid rgba(138,43,226,0.55)",
                backgroundColor: "rgba(138,43,226,0.14)",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
