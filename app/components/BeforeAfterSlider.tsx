"use client";

import { useRef, useEffect, useCallback } from "react";
import Image from "next/image";

const IMG_SIZES = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

// Va-et-vient automatique de la barre : elle part de la droite, glisse vers la
// gauche, puis revient. Le cosinus donne un mouvement doux aux deux extrémités.
const AUTO_CENTER    = 50;   // %
const AUTO_AMPLITUDE = 35;   // % → la barre oscille entre 15 % et 85 %
const AUTO_PERIOD    = 7000; // ms pour un aller-retour complet
const START_POS      = AUTO_CENTER + AUTO_AMPLITUDE; // 85 % : départ à droite

interface Props {
  before: string;
  after:  string;
  alt?:   string;
}

export default function BeforeAfterSlider({ before, after, alt = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeRef    = useRef<HTMLDivElement>(null);
  const lineRef      = useRef<HTMLDivElement>(null);
  const handleRef    = useRef<HTMLDivElement>(null);

  const dragging = useRef(false);
  const userTook = useRef(false); // l'utilisateur a pris la main → plus d'auto
  const visible  = useRef(true);  // hors écran → animation en pause

  // La position est écrite directement dans le DOM : aucun re-render React à
  // 60 fps, l'animation reste fluide même avec plusieurs sliders sur la page.
  const applyPos = useCallback((pct: number) => {
    const p = Math.min(100, Math.max(0, pct));
    if (beforeRef.current) beforeRef.current.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
    if (lineRef.current)   lineRef.current.style.left       = `${p}%`;
    if (handleRef.current) handleRef.current.style.left     = `${p}%`;
  }, []);

  const updateFromPointer = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const { left, width } = el.getBoundingClientRect();
    applyPos(((clientX - left) / width) * 100);
  }, [applyPos]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = containerRef.current;
    let raf = 0;
    let last = 0;
    let elapsed = 0; // n'avance que quand le slider est visible → pas de saut

    const loop = (now: number) => {
      if (userTook.current) return; // l'utilisateur pilote : on arrête l'auto
      if (!last) last = now;
      const dt = now - last;
      last = now;

      if (visible.current) {
        elapsed += dt;
        const t = (elapsed % AUTO_PERIOD) / AUTO_PERIOD;
        applyPos(AUTO_CENTER + AUTO_AMPLITUDE * Math.cos(t * Math.PI * 2));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    let obs: IntersectionObserver | undefined;
    if (el && typeof IntersectionObserver !== "undefined") {
      obs = new IntersectionObserver(
        ([entry]) => { visible.current = entry.isIntersecting; },
        { threshold: 0 },
      );
      obs.observe(el);
    }

    return () => { cancelAnimationFrame(raf); obs?.disconnect(); };
  }, [applyPos]);

  const onPointerDown = (e: React.PointerEvent) => {
    userTook.current = true;
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    updateFromPointer(e.clientX);
  };
  const onPointerUp = () => { dragging.current = false; };

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden">
      {/* Après (image complète, en dessous) */}
      <Image src={after} alt={`${alt} après`} fill sizes={IMG_SIZES} className="object-cover" draggable={false} />

      {/* Avant (rognée à gauche de la barre) */}
      <div
        ref={beforeRef}
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - START_POS}% 0 0)` }}
      >
        <Image src={before} alt={`${alt} avant`} fill sizes={IMG_SIZES} className="object-cover" draggable={false} />
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
