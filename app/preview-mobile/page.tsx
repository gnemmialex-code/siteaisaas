"use client";

/**
 * Page de contrôle visuel (dev only) : rend n'importe quelle route du site
 * dans une maquette d'iPhone 16 (viewport logique 393 × 852 px).
 * → http://localhost:3001/preview-mobile
 */

import { useState } from "react";

// iPhone 16 : 393 × 852 pt (logique), iPhone 16 Pro Max : 440 × 956
const DEVICES = [
  { id: "16", name: "iPhone 16", w: 393, h: 852 },
  { id: "16plus", name: "iPhone 16 Plus", w: 430, h: 932 },
  { id: "16pro", name: "iPhone 16 Pro", w: 402, h: 874 },
  { id: "16promax", name: "iPhone 16 Pro Max", w: 440, h: 956 },
  { id: "se", name: "iPhone SE", w: 375, h: 667 },
];

const ROUTES = ["/", "/dashboard", "/pricing", "/result"];

export default function PreviewMobilePage() {
  const [device, setDevice] = useState(DEVICES[0]);
  const [route, setRoute] = useState(ROUTES[0]);
  const [key, setKey] = useState(0);

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center gap-6 py-8 px-4">
      {/* Barre de contrôle */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <select
          value={device.id}
          onChange={(e) => setDevice(DEVICES.find((d) => d.id === e.target.value)!)}
          className="bg-neutral-800 border border-white/15 rounded-lg px-3 py-2"
        >
          {DEVICES.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} — {d.w}×{d.h}
            </option>
          ))}
        </select>

        <input
          value={route}
          onChange={(e) => setRoute(e.target.value)}
          className="bg-neutral-800 border border-white/15 rounded-lg px-3 py-2 w-56"
          placeholder="/"
        />

        <button
          onClick={() => setKey((k) => k + 1)}
          className="bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg px-3 py-2"
        >
          Recharger
        </button>

        <span className="text-white/40">
          {device.w} × {device.h} px
        </span>
      </div>

      {/* Châssis du téléphone */}
      <div
        className="relative rounded-[3.2rem] bg-neutral-950 p-3 shadow-2xl ring-1 ring-white/10"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}
      >
        {/* Boutons latéraux */}
        <div className="absolute -left-[3px] top-28 h-8 w-[3px] rounded-l bg-neutral-700" />
        <div className="absolute -left-[3px] top-40 h-14 w-[3px] rounded-l bg-neutral-700" />
        <div className="absolute -left-[3px] top-[14.5rem] h-14 w-[3px] rounded-l bg-neutral-700" />
        <div className="absolute -right-[3px] top-44 h-20 w-[3px] rounded-r bg-neutral-700" />

        {/* Écran */}
        <div
          className="relative overflow-hidden rounded-[2.6rem] bg-black"
          style={{ width: device.w, height: device.h }}
        >
          <iframe
            key={`${key}-${route}-${device.id}`}
            src={route}
            title={`${device.name} — ${route}`}
            className="block border-0"
            style={{ width: device.w, height: device.h }}
          />

          {/* Dynamic Island */}
          <div className="pointer-events-none absolute left-1/2 top-2.5 h-[26px] w-[104px] -translate-x-1/2 rounded-full bg-black" />

          {/* Indicateur home */}
          <div className="pointer-events-none absolute bottom-2 left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-white/70 mix-blend-difference" />
        </div>
      </div>

      <p className="text-white/40 text-xs text-center max-w-md">
        L&apos;iframe utilise la vraie largeur logique de l&apos;appareil : les breakpoints
        Tailwind (<code>sm:</code> = 640 px) réagissent donc exactement comme sur le téléphone.
      </p>
    </div>
  );
}
