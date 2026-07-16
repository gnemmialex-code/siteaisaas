"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";

const IMG_SIZES = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

interface Props {
  before: string;
  after:  string;
  alt?:   string;
}

export default function BeforeAfterSlider({ before, after, alt = "" }: Props) {
  const [pos, setPos]       = useState(50); // % from left
  const containerRef        = useRef<HTMLDivElement>(null);
  const dragging            = useRef(false);

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const { left, width } = el.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - left) / width) * 100));
    setPos(pct);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
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
      {/* After (full) */}
      <Image src={after} alt={`${alt} après`} fill sizes={IMG_SIZES} className="object-cover" draggable={false} />

      {/* Before (clipped to left of slider) */}
      <Image
        src={before}
        alt={`${alt} avant`}
        fill
        sizes={IMG_SIZES}
        className="object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        draggable={false}
      />

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-px bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.6)]"
        style={{ left: `${pos}%` }}
      />

      {/* Handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
        style={{ left: `${pos}%` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M5 4L2 8l3 4M11 4l3 4-3 4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Labels */}
      <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white/80 text-xs px-2 py-0.5 rounded-lg border border-white/10 pointer-events-none">
        Avant
      </span>
      <span className="absolute top-2 right-2 bg-accent-violet/80 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-lg pointer-events-none">
        Après
      </span>
    </div>
  );
}
