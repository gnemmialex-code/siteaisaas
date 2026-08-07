"use client";

import { useRef, useEffect, useCallback } from "react";
import Image from "next/image";

const IMG_SIZES = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

// Réglages du balayage automatique de la barre de comparaison.
const SWEEP_PERIOD_MS = 9000; // durée d'un aller-retour complet (lent et tranquille)
const SWEEP_AMPLITUDE = 28;   // % de part et d'autre du centre → balaye de 22 % à 78 %
const START_POS       = 50;   // position initiale de la barre, en %

interface Props {
  before: string;
  after:  string;
  /** Libellé du modèle, utilisé pour composer un alt de repli. */
  alt?:   string;
  /** Textes alternatifs propres à chaque moitié. Priment sur `alt`. */
  altBefore?: string;
  altAfter?:  string;
  /** Balayage automatique de la barre. Désactivé dès que l'utilisateur la saisit. */
  autoPlay?: boolean;
  /**
   * Précharge les deux moitiés. À réserver au comparateur visible sans
   * défilement : sur téléphone, c'est lui l'élément LCP de la page d'accueil,
   * et le laisser en chargement différé retardait le rendu de plusieurs
   * secondes.
   */
  priority?: boolean;
}

export default function BeforeAfterSlider({
  before,
  after,
  alt = "",
  altBefore,
  altAfter,
  autoPlay = true,
  priority = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeRef    = useRef<HTMLDivElement>(null);
  const lineRef      = useRef<HTMLDivElement>(null);
  const handleRef    = useRef<HTMLDivElement>(null);
  const dragging     = useRef(false);
  // Passe à false définitivement dès que l'utilisateur déplace la barre lui-même.
  const autoRef      = useRef(autoPlay);

  // On écrit directement dans le DOM plutôt que via un state React :
  // évite un re-render à chaque frame (60 fps × plusieurs sliders sur la page).
  const applyPos = useCallback((pct: number) => {
    if (beforeRef.current) beforeRef.current.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    if (lineRef.current)   lineRef.current.style.left       = `${pct}%`;
    if (handleRef.current) handleRef.current.style.left     = `${pct}%`;
  }, []);

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const { left, width } = el.getBoundingClientRect();
    applyPos(Math.min(100, Math.max(0, ((clientX - left) / width) * 100)));
  }, [applyPos]);

  // ── Balayage automatique ──
  useEffect(() => {
    if (!autoPlay) return;
    // Respecte le réglage système « réduire les animations »
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = containerRef.current;
    if (!el) return;

    let raf = 0;
    let visible = false;
    const start = performance.now();

    const loop = (t: number) => {
      if (visible && autoRef.current && !dragging.current) {
        const phase = ((t - start) % SWEEP_PERIOD_MS) / SWEEP_PERIOD_MS;
        // Cosinus → mouvement continu qui ralentit naturellement aux deux extrémités
        applyPos(START_POS - Math.cos(phase * Math.PI * 2) * SWEEP_AMPLITUDE);
      }
      raf = requestAnimationFrame(loop);
    };

    // N'anime que lorsque le slider est réellement à l'écran
    const io = new IntersectionObserver(
      ([entry]) => { visible = entry.isIntersecting; },
      { threshold: 0.1 },
    );
    io.observe(el);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [autoPlay, applyPos]);

  const onPointerDown = (e: React.PointerEvent) => {
    autoRef.current  = false; // l'utilisateur reprend la main
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updatePos(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    updatePos(e.clientX);
  };
  const onPointerUp = () => { dragging.current = false; };

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden">
      {/* Après (image complète) */}
      <Image src={after} alt={altAfter ?? `${alt} après`} fill sizes={IMG_SIZES} priority={priority} className="object-cover" draggable={false} />

      {/* Avant (rognée à gauche de la barre) */}
      <div
        ref={beforeRef}
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - START_POS}% 0 0)` }}
      >
        <Image src={before} alt={altBefore ?? `${alt} avant`} fill sizes={IMG_SIZES} priority={priority} className="object-cover" draggable={false} />
      </div>

      {/* Barre de séparation */}
      <div
        ref={lineRef}
        className="absolute top-0 bottom-0 w-px bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.6)]"
        style={{ left: `${START_POS}%` }}
      />

      {/* Poignée */}
      <div
        ref={handleRef}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
        style={{ left: `${START_POS}%` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M5 4L2 8l3 4M11 4l3 4-3 4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Étiquettes */}
      <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white/80 text-xs px-2 py-0.5 rounded-lg border border-white/10 pointer-events-none">
        Avant
      </span>
      <span className="absolute top-2 right-2 bg-accent-violet/80 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-lg pointer-events-none">
        Après
      </span>
    </div>
  );
}
