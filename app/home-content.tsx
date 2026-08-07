"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BeforeAfterSlider from "./components/BeforeAfterSlider";
import { HOME_FAQ } from "@/lib/faq";
import {
  Sparkles, Star, ArrowRight, Play,
  ChevronDown, Quote, ImageIcon, Film,
} from "lucide-react";

// ─── DONNÉES ────────────────────────────────────────────────────────────────


const STATS = [
  { value: "50K+", label: "Générations" },
  { value: "4.9★", label: "Note moyenne" },
  { value: "<30s", label: "Temps moyen" },
  { value: "4K", label: "Résolution max" },
];

const REVIEWS = [
  { name: "Soph!_mtbl", city: "Paris", stars: 5, text: "Incroyable ! Le résultat est tellement réaliste, j'ai partagé sur Instagram et tout le monde pensait que c'était vrai." },
  { name: "Lucasss9378!", city: "Lyon", stars: 5, text: "La qualité 4K est bluffante. En 30 secondes j'avais mon photo en style Hollywood. Je recommande vivement !" },
  { name: "Chl0E.BRZH", city: "Bordeaux", stars: 5, text: "Parfait pour les photos de profil. Le style Vogue Editorial est mon préféré, le rendu est professionnel." },
  { name: "Max.xAm76", city: "Dijon", stars: 5, text: "J'utilise AstraCrea chaque semaine. L'abonnement Pro en illimité, excellent rapport qualité/prix." },
  { name: "Em1.Rtbu", city: "Nantes", stars: 4, text: "Très bon service ! Seul petit bémol, parfois 40 secondes au lieu de 20 habituellement. Je pense que je vais passer à Ultra pour aller plus vite !" },
  { name: "ThomAss772ltrb", city: "Toulouse", stars: 5, text: "J'ai essayé d'autres outils, rien n'arrive à la cheville d'AstraCrea. La précision de la transformation est exceptionnelle." },
  { name: "Cam.sdr", city: "Strasbourg", stars: 5, text: "Le style Met Gala est trop bien. On dirait une vraie photo de gala. Mes amis n'en reviennent pas !" },
  { name: "FelixStrxu", city: "Nice", stars: 5, text: "Simple, rapide, bluffant. Je l'utilise pour mes contenus créatifs. Le pipeline IA est vraiment au top." },
  { name: "Saitawann.94", city: "Paris", stars: 5, text: "La vérité c'est rapide, qualité et le résultat est direct au rendez-vous !" },

];

// Pour les exemples : mets tes vraies images dans /public/examples/
// Format : { style, before: "/examples/before1.jpg", after: "/examples/after1.jpg" }
// Cette liste n'est affichée QUE sur ordinateur (sm+), dans l'ordre du tableau.
// Sur téléphone, seul MOBILE_EXAMPLE (plus bas) est affiché, à côté de la vidéo :
// les champs `mobile` / `mobileFirst` ne servent donc plus.
// ⬇️ C'EST ICI QU'ON NOMME LES EXEMPLES : le champ `style` est le texte affiché
// en bas de chaque carte sur le site. Les fichiers restent A1…A6 dans /public/examples/.
// `altBefore` / `altAfter` : texte alternatif de chaque moitié du comparateur.
// Contrairement au fond du hero, ces images sont du vrai contenu de page —
// chaque texte est donc descriptif et unique.
const EXAMPLES_IMAGES = [
  {
    style: "Hublot Big Bang",
    before: "/examples/A1_avant.png", after: "/examples/A1_apres.png",
    altBefore: "Poignet nu photographié avant l'essayage virtuel de la Hublot Big Bang",
    altAfter:  "Hublot Big Bang ajoutée au poignet par l'IA AstraCrea, rendu photoréaliste 4K",
    mobile: false, mobileFirst: false,
  },
  {
    style: "Rolex Deepsea D-Blue",
    before: "/examples/A2_avant.png", after: "/examples/A2_apres.png",
    altBefore: "Poignet nu photographié avant l'essayage virtuel de la Rolex Deepsea D-Blue",
    altAfter:  "Rolex Deepsea au cadran dégradé bleu et noir ajoutée au poignet par l'IA AstraCrea",
    mobile: true,  mobileFirst: false,
  },
  {
    style: "Hublot Classic Fusion",
    before: "/examples/A3_avant.png", after: "/examples/A3_apres.png",
    altBefore: "Poignet nu photographié avant l'essayage virtuel de la Hublot Classic Fusion",
    altAfter:  "Hublot Classic Fusion au boîtier fin ajoutée au poignet par l'IA AstraCrea",
    mobile: false, mobileFirst: false,
  },
  {
    style: "Rolex Oyster Perpetual",
    before: "/examples/A4_avant.png", after: "/examples/A4_apres.png",
    altBefore: "Poignet nu photographié avant l'essayage virtuel de la Rolex Oyster Perpetual",
    altAfter:  "Rolex Oyster Perpetual sur bracelet acier ajoutée au poignet par l'IA AstraCrea",
    mobile: false, mobileFirst: false,
  },
  {
    style: "Tudor Black Bay",
    before: "/examples/A5_avant.png", after: "/examples/A5_apres.png",
    altBefore: "Poignet nu photographié avant l'essayage virtuel de la Tudor Black Bay",
    altAfter:  "Tudor Black Bay à lunette de plongée ajoutée au poignet par l'IA AstraCrea",
    mobile: false, mobileFirst: false,
  },
  {
    style: "Rolex Submariner Hulk",
    before: "/examples/A6_avant.png", after: "/examples/A6_apres.png",
    altBefore: "Poignet nu photographié avant l'essayage virtuel de la Rolex Submariner Hulk",
    altAfter:  "Rolex Submariner Hulk au cadran et à la lunette verts ajoutée au poignet par l'IA AstraCrea",
    mobile: true,  mobileFirst: true,
  },
];

// Vidéos : remplis youtubeId OU localSrc (pas les deux)
// localSrc : mets ta vidéo dans /public/videos/ et indique le chemin ex: "/videos/demo.mp4"
// encodeURI() est nécessaire car le nom du fichier contient des accents.
const EXAMPLES_VIDEOS = [
  {
    title: "Génération Hublot",
    youtubeId: null,
    localSrc: encodeURI("/videos/test_vidéo_génération_hublot.MP4"),
  },
];

// Exemple affiché sur téléphone (à côté de la vidéo) dans « Exemples de transformations ».
const MOBILE_EXAMPLE =
  EXAMPLES_IMAGES.find(e => e.style === "Rolex Submariner Hulk") ?? EXAMPLES_IMAGES[0];

// ─── VIDÉO DÉMO (section sous le hero) ──────────────────────────────────────
// Version PC (horizontale). Section masquée sur téléphone (visible à partir de sm).
const DEMO_VIDEO = "/videos/tuto-astra-horizontal.mp4";

// Le texte de la FAQ vit dans lib/faq.ts : il alimente à la fois cet accordéon
// et le balisage FAQPage de app/page.tsx, qui doivent rester identiques.
const FAQ_ITEMS = HOME_FAQ;

// ─── COMPOSANTS INTERNES ────────────────────────────────────────────────────

// Images du fond du hero, dans /public/hero-gallery/.
// Les premières de chaque liste sont celles visibles à l'ouverture du site
// (ligne 1 défile vers la gauche, ligne 2 vers la droite).
const ROW1 = [
  "img35", "img36", "img37", "img38", "img39", "img40",
  "img47", "img48", "img49", "img50", "img51", "img52", "img53",
  "img60", "img61", "img62", "img63", "img64",
].map(n => `/hero-gallery/${n}.png`);
const ROW2 = [
  "img41", "img42", "img43", "img44", "img45", "img46",
  "img54", "img55", "img56", "img57", "img58", "img59",
  "img65", "img66", "img67", "img68", "img69",
].map(n => `/hero-gallery/${n}.png`);
// 3e ligne affichée UNIQUEMENT sur téléphone. Elle met en avant les dernières
// images ajoutées : img69 → img60 en tête de liste, donc ce sont elles qu'on
// voit à l'ouverture du site. Les plus anciennes complètent la boucle.
const ROW3 = [
  "img69", "img68", "img67", "img66", "img65",
  "img64", "img63", "img62", "img61", "img60",
  "img53", "img47", "img41", "img35",
].map(n => `/hero-gallery/${n}.png`);

function ImageRow({
  images,
  direction,
}: {
  images: string[];
  direction: "left" | "right";
}) {
  // Dupliquer les images pour boucle seamless
  const doubled = [...images, ...images];

  return (
    /* shrink-0 : sans ça le conteneur flex écrase les lignes et elles se chevauchent */
    <div className="overflow-hidden w-full shrink-0">
      <div
        className={`flex w-max gap-1.5 sm:gap-3 ${
          direction === "left" ? "animate-scroll-left" : "animate-scroll-right"
        }`}
      >
        {doubled.map((src, i) => (
          <div
            key={i}
            /* Tuiles réduites sur téléphone (les 3 lignes tiennent entièrement
               dans le hero), taille d'origine sur ordinateur */
            className="flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden w-[100px] h-[167px] sm:w-[300px] sm:h-[500px]"
          >
            <Image
              src={src}
              alt=""
              width={300}
              height={500}
              priority={i < 3}
              loading={i < 5 ? "eager" : "lazy"}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Cache la cellule si l'image n'existe pas encore
                (e.currentTarget.parentElement as HTMLElement).style.display = "none";
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroImageBackground() {
  return (
    /* aria-hidden : ce fond est décoratif. Chaque image y est présente deux fois
       (la liste est dupliquée pour la boucle de défilement), elle est posée sous
       plusieurs voiles sombres et n'est jamais cliquable — un texte alternatif
       n'apporterait rien d'autre que du bruit dans les lecteurs d'écran. */
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden select-none pointer-events-none">
      {/* Fond noir de base */}
      <div className="absolute inset-0 bg-[#0D0D0D]" />

      {/* Lignes d'images depuis le haut — 3 lignes sur téléphone, 2 sur ordinateur */}
      <div
        className="absolute inset-0 flex flex-col justify-start gap-1.5 sm:gap-4"
        style={{ opacity: 0.7 }}
      >
        <ImageRow images={ROW1} direction="left" />
        <ImageRow images={ROW2} direction="right" />
        <div className="sm:hidden shrink-0">
          <ImageRow images={ROW3} direction="left" />
        </div>
      </div>

      {/* ── Overlays pour lisibilité du texte ── */}
      {/* Vignette générale */}
      <div className="absolute inset-0 bg-background/45" />
      {/* Fondu haut léger (navbar) */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/70 to-transparent" />
      {/* Dégradé noir bas — plus court sur téléphone pour laisser respirer la 3e ligne */}
      <div className="absolute bottom-0 left-0 right-0 h-[240px] sm:h-[320px] bg-gradient-to-t from-background from-40% via-background/80 to-transparent" />
      {/* Fondu gauche */}
      <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      {/* Fondu droite */}
      <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

/**
 * Bouton « Essayer gratuitement » animé.
 * Trois couches d'animation qui tournent en continu :
 *   1. deux halos dégradés qui se croisent derrière (violet ↔ cyan) ;
 *   2. un reflet lumineux qui balaie le bouton PAR-DESSUS le dégradé ;
 *   3. un léger battement d'échelle.
 */
function AnimatedCta({
  className = "",
  fullWidth = false,
}: {
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={`relative ${fullWidth ? "w-full" : "inline-block"}`}>
      {/* Halo 1 — violet → cyan */}
      <motion.div
        aria-hidden
        className="absolute -inset-1.5 rounded-xl blur-lg bg-gradient-to-r from-accent-violet to-accent-neon pointer-events-none"
        animate={{ opacity: [0.35, 0.85, 0.35], scale: [1, 1.07, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Halo 2 — cyan → violet, en opposition de phase : la couleur du halo glisse */}
      <motion.div
        aria-hidden
        className="absolute -inset-1.5 rounded-xl blur-xl bg-gradient-to-r from-accent-neon to-accent-violet pointer-events-none"
        animate={{ opacity: [0.75, 0.2, 0.75], scale: [1.06, 1, 1.06] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative"
        animate={{ scale: [1, 1.035, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        whileTap={{ scale: 0.95 }}
      >
        <Link
          href="/dashboard"
          className={`btn-primary relative overflow-hidden flex items-center justify-center gap-2 group ${
            fullWidth ? "w-full" : ""
          } ${className}`}
        >
          {/* Reflet qui balaie le bouton, au-dessus du dégradé mais sous le texte */}
          <motion.span
            aria-hidden
            className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/40 blur-md pointer-events-none"
            animate={{ x: ["0%", "500%"] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              repeatDelay: 1.6,
              ease: "easeInOut",
            }}
          />
          <span className="relative">Essayer gratuitement</span>
          <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>
    </div>
  );
}

/**
 * Bouton « Essayer gratuitement » collant — TÉLÉPHONE UNIQUEMENT.
 * Tant que le bouton du hero est à l'écran, rien ne s'affiche. Dès que le
 * visiteur le dépasse en scrollant, une barre se pose sous la navbar et
 * suit l'écran pour le reste de la page.
 */
function MobileStickyCta({ anchorRef }: { anchorRef: React.RefObject<HTMLDivElement | null> }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      // NAVBAR_H = h-16 (64 px) : on affiche dès que le bouton passe dessous.
      setVisible(el.getBoundingClientRect().bottom < 64);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [anchorRef]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -70, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -70, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          /* Sans fond : le bouton flotte seul au-dessus de la page, posé un peu
             plus bas que la navbar pour ne pas la toucher. */
          className="sm:hidden fixed top-[88px] left-0 right-0 z-40 px-4"
        >
          <AnimatedCta fullWidth className="py-3 text-base" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ReviewsMarquee() {
  return (
    <div className="relative overflow-hidden py-1 sm:py-2">
      {/* Fade gauche */}
      <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      {/* Fade droite */}
      <div className="absolute right-0 top-0 bottom-0 w-10 sm:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div
        className="flex gap-2 sm:gap-3 w-max"
        style={{ animation: "marquee 40s linear infinite" }}
      >
        {[...REVIEWS, ...REVIEWS].map((review, i) => (
          <div
            key={i}
            className="w-48 sm:w-64 flex-shrink-0 card border border-surface-border p-2.5 sm:p-3.5 rounded-xl"
          >
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <div className="flex gap-0.5">
                {Array.from({ length: review.stars }).map((_, s) => (
                  <Star key={s} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400" />
                ))}
                {Array.from({ length: 5 - review.stars }).map((_, s) => (
                  <Star key={s} className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/20" />
                ))}
              </div>
              <Quote className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-violet/40" />
            </div>
            <p className="text-white/70 text-[10px] sm:text-xs leading-relaxed mb-2 sm:mb-3 line-clamp-2">
              &ldquo;{review.text}&rdquo;
            </p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-violet-neon flex items-center justify-center text-white text-[9px] sm:text-[10px] font-bold flex-shrink-0">
                {review.name.charAt(0)}
              </div>
              <div>
                <p className="text-white font-medium text-[10px] sm:text-xs leading-none">{review.name}</p>
                <p className="text-white/40 text-[9px] sm:text-[10px] mt-0.5">{review.city}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function ExamplesGallery() {
  const [tab, setTab] = useState<"images" | "videos">("images");
  // Téléphone : les autres exemples sont repliés derrière un bouton « Voir plus »
  const [showAll, setShowAll] = useState(false);
  const extraExamples = EXAMPLES_IMAGES.filter(e => e.style !== MOBILE_EXAMPLE.style);

  return (
    <div>
      {/* ── TÉLÉPHONE : l'exemple photo + la vidéo, côte à côte ── */}
      <div className="sm:hidden">
      <div className="grid grid-cols-2 gap-3">
        <div
          className="relative rounded-2xl overflow-hidden border border-surface-border"
          style={{ aspectRatio: "9/16" }}
        >
          <BeforeAfterSlider
            before={MOBILE_EXAMPLE.before}
            after={MOBILE_EXAMPLE.after}
            alt={MOBILE_EXAMPLE.style}
            altBefore={MOBILE_EXAMPLE.altBefore}
            altAfter={MOBILE_EXAMPLE.altAfter}
          />
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
            <p className="text-white text-xs font-medium">{MOBILE_EXAMPLE.style}</p>
          </div>
        </div>
        <div
          className="relative rounded-2xl overflow-hidden border border-surface-border bg-surface-hover"
          style={{ aspectRatio: "9/16" }}
        >
          <video
            src={EXAMPLES_VIDEOS[0].localSrc}
            aria-label="Vidéo : génération par IA d'une Hublot au poignet, de la photo d'origine au rendu final"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover pointer-events-none"
          />
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
            <p className="text-white text-xs font-medium">{EXAMPLES_VIDEOS[0].title}</p>
          </div>
        </div>
      </div>

      {/* Autres exemples, dépliés par « Voir plus » */}
      <AnimatePresence initial={false}>
        {showAll && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 mt-3">
              {extraExamples.map((ex) => (
                <div
                  key={ex.style}
                  className="relative rounded-2xl overflow-hidden border border-surface-border"
                  style={{ aspectRatio: "9/16" }}
                >
                  <BeforeAfterSlider
                    before={ex.before}
                    after={ex.after}
                    alt={ex.style}
                    altBefore={ex.altBefore}
                    altAfter={ex.altAfter}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
                    <p className="text-white text-xs font-medium">{ex.style}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setShowAll(v => !v)}
        className="mx-auto mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface border border-surface-border text-white/70 hover:text-white hover:border-accent-violet/40 text-xs font-medium transition-all active:scale-95"
      >
        {showAll ? "Voir moins" : "Voir plus"}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAll ? "rotate-180" : ""}`} />
      </button>
      </div>{/* end téléphone */}

      {/* ── ORDINATEUR : onglets Photos / Vidéos ── */}
      <div className="hidden sm:block">
      {/* Onglets */}
      <div className="flex justify-center gap-2 mb-10">
        {[
          { id: "images" as const, label: "Photos", icon: <ImageIcon className="w-4 h-4" /> },
          { id: "videos" as const, label: "Vidéos", icon: <Film className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              tab === t.id
                ? "bg-accent-violet text-white shadow-violet"
                : "bg-surface border border-surface-border text-white/50 hover:text-white hover:border-accent-violet/40"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "images" ? (
          <motion.div
            key="images"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          >
            {EXAMPLES_IMAGES.map((ex, i) => (
              <motion.div
                key={ex.style}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className={`group relative rounded-2xl overflow-hidden border border-surface-border hover:border-accent-violet/50 transition-all duration-300 ${ex.mobile ? "" : "hidden sm:block"} ${ex.mobileFirst ? "order-first sm:order-none" : ""}`} style={{ aspectRatio: "9/16" }}
              >
                {ex.before && ex.after ? (
                  <BeforeAfterSlider
                    before={ex.before}
                    after={ex.after}
                    alt={ex.style}
                    altBefore={ex.altBefore}
                    altAfter={ex.altAfter}
                  />
                ) : (
                  /* Placeholder jusqu'à avoir de vraies images */
                  <div className="w-full h-full bg-surface-hover flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-violet-neon flex items-center justify-center text-white font-bold text-lg">
                      {ex.style.charAt(0)}
                    </div>
                    <p className="text-white/30 text-xs text-center px-4">
                      Image exemple<br />{ex.style}
                    </p>
                    <p className="text-white/15 text-xs">/public/examples/</p>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
                  <p className="text-white text-sm font-medium">{ex.style}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="videos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-wrap justify-center gap-6"
          >
            {EXAMPLES_VIDEOS.map((vid, i) => (
              <motion.div
                key={vid.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="w-full max-w-xs rounded-2xl overflow-hidden border border-surface-border"
              >
                <div className="bg-surface-hover relative group" style={{ aspectRatio: "9/16" }}>
                  {vid.youtubeId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${vid.youtubeId}?rel=0`}
                      title={vid.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : vid.localSrc ? (
                    <video
                      src={vid.localSrc}
                      aria-label={`Vidéo d'exemple : ${vid.title} générée par l'IA AstraCrea`}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    /* Placeholder vidéo */
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-accent-violet/20 border border-accent-violet/40 flex items-center justify-center group-hover:bg-accent-violet/30 transition-colors">
                        <Play className="w-7 h-7 text-accent-violet fill-accent-violet ml-1" />
                      </div>
                      <div className="text-center">
                        <p className="text-white/40 text-sm">Vidéo de démonstration</p>
                        <p className="text-white/20 text-xs mt-1">Ajoutez localSrc dans EXAMPLES_VIDEOS</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-surface">
                  <p className="font-medium text-white">{vid.title}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      </div>{/* end ordinateur */}
    </div>
  );
}

// ─── SECTION VIDÉO DÉMO ─────────────────────────────────────────────────────

function DemoVideoSection() {
  // La vidéo (~7 Mo) n'est montée que lorsque la section approche de l'écran
  const videoZoneRef = useRef<HTMLDivElement>(null);
  const videoInView  = useInView(videoZoneRef, { once: true, margin: "300px" });

  return (
    /* Visible partout, en format horizontal 16/9 — compactée sur téléphone */
    <section id="demo" className="py-8 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Orbes décoratifs */}
      <motion.div
        className="absolute -top-20 left-1/4 w-80 h-80 rounded-full bg-accent-violet/12 blur-3xl pointer-events-none"
        animate={{ x: [0, 40, 0], y: [0, 25, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-20 right-1/4 w-72 h-72 rounded-full bg-accent-neon/8 blur-3xl pointer-events-none"
        animate={{ x: [0, -35, 0], y: [0, -20, 0], scale: [1, 1.25, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4 sm:mb-10"
        >
          <span className="inline-flex items-center gap-1.5 sm:gap-2 bg-accent-violet/10 border border-accent-violet/30 text-accent-violet text-[11px] sm:text-sm font-semibold px-3 py-1 sm:px-4 sm:py-2 rounded-full mb-2 sm:mb-6">
            <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
            Démonstration
          </span>
          <h2 className="text-xl sm:text-5xl font-bold mb-1 sm:mb-4">
            Voyez la magie <span className="gradient-text">en action</span>
          </h2>
          <p className="text-white/50 text-xs sm:text-lg max-w-xl mx-auto">
            De la photo originale au résultat final !
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Lecture auto en boucle dès le chargement,
              impossible à mettre en pause ou télécharger. */}
          <div className="mx-auto max-w-4xl" ref={videoZoneRef}>
            <div className="relative rounded-3xl overflow-hidden border border-surface-border bg-surface shadow-violet select-none">
              {/* Liseré dégradé */}
              <div className="absolute inset-0 rounded-3xl pointer-events-none z-10" style={{ boxShadow: "inset 0 0 0 1px rgba(138,43,226,0.25)" }} />
              <div className="relative bg-surface-hover" style={{ aspectRatio: "16/9" }}>
                {videoInView && (
                  <video
                    src={DEMO_VIDEO}
                    aria-label="Démonstration AstraCrea : de la photo d'origine au rendu 4K d'une montre de luxe au poignet"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    disablePictureInPicture
                    controlsList="nodownload noplaybackrate"
                    onContextMenu={e => e.preventDefault()}
                    onPause={e => { e.currentTarget.play().catch(() => {}); }}
                    className="w-full h-full object-cover absolute inset-0 pointer-events-none"
                  />
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Accordéon FAQ.
 *
 * Les réponses sont TOUJOURS présentes dans le DOM, y compris dans le HTML
 * rendu par le serveur : elles ne sont plus montées conditionnellement en JS.
 * Le repli est purement CSS — une grille dont la ligne passe de 0fr à 1fr,
 * ce qui anime la hauteur aussi bien que l'ancien `height: auto` de
 * framer-motion, mais sans démonter le texte. Un crawler qui n'exécute pas
 * (ou peu) de JavaScript lit donc les quatre réponses en entier.
 */
function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2 sm:space-y-3">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = open === i;
        const panelId = `faq-panel-${i}`;
        const buttonId = `faq-button-${i}`;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className={`border rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-200 ${
              isOpen ? "border-accent-violet/50 bg-accent-violet/5" : "border-surface-border bg-surface"
            }`}
          >
            {/* h3 : la question est un vrai niveau de titre sous le h2
                « Questions fréquentes », pas un simple libellé de bouton. */}
            <h3>
              <button
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3.5 text-left group"
              >
                <span className={`font-semibold text-xs sm:text-sm transition-colors ${isOpen ? "text-white" : "text-white/80 group-hover:text-white"}`}>
                  {item.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ml-3 sm:ml-4 transition-all duration-300 ${
                    isOpen ? "rotate-180 text-accent-violet" : "text-white/30 group-hover:text-white/60"
                  }`}
                />
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows] duration-[250ms] ease-in-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-3.5 pb-3 sm:px-5 sm:pb-4 text-white/60 leading-relaxed text-[11px] sm:text-sm">
                  {item.a}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── PAGE PRINCIPALE ────────────────────────────────────────────────────────

export default function HomeContent() {
  // Repère du bouton « Essayer gratuitement » du hero : sert à déclencher
  // la version collante sur téléphone une fois qu'on l'a dépassé.
  const heroCtaRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <MobileStickyCta anchorRef={heroCtaRef} />

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      {/* Téléphone : contenu ancré en bas (items-end) — le vide restant passe au-dessus,
          sur la galerie de fond, au lieu de séparer le bouton des exemples. */}
      <section className="relative min-h-[62vh] sm:min-h-screen flex items-end sm:items-center justify-center overflow-hidden">
        <HeroImageBackground />

        {/* pb-8 sur téléphone : le hero est en overflow-hidden, sans cette marge
            le halo animé sous le bouton se fait couper net par le bas du hero. */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 bg-accent-violet/10 border border-accent-violet/30 text-accent-violet text-xs sm:text-sm font-medium px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-8">
              <Sparkles className="w-4 h-4" />
              Technologie IA de pointe
            </span>
          </motion.div>

          {/* Unique <h1> de la page. Le slogan reste le texte géant ; la ligne
              descriptive qui suit était un <p> séparé — elle est maintenant un
              <span> à l'intérieur du h1, pour que le titre principal contienne
              les termes réellement recherchés. Les classes de chaque partie sont
              celles d'avant, le rendu est identique. */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[2rem] sm:text-7xl lg:text-8xl font-black leading-tight mb-5 sm:mb-12"
          >
            Fake It{" "}
            <span className="gradient-text">Until You</span>
            <br />
            <span className="text-white/90">Make It</span>
            <span className="block font-normal tracking-normal leading-normal text-sm sm:text-2xl text-white/60 max-w-2xl mx-auto mt-3 sm:mt-6">
              Essayage virtuel de montres de luxe par IA : les modèles les plus
              rares à votre poignet, en 4K et en moins de 30 secondes.
            </span>
          </motion.h1>

          <motion.div
            ref={heroCtaRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-0 sm:mb-16"
          >
            <AnimatedCta className="text-lg px-8 py-4" />
          </motion.div>

          {/* Stats — entièrement masquées sur téléphone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="hidden sm:grid sm:grid-cols-4 gap-6 max-w-2xl mx-auto"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black gradient-text">{stat.value}</div>
                <div className="text-white/50 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ SÉPARATEUR ANIMÉ HERO → SUITE ═══════════════════════════════ */}
      {/* Masqué sur téléphone : le hero enchaîne directement sur les exemples */}
      <div className="relative hidden sm:block h-28 overflow-hidden pointer-events-none select-none">
        {/* Ligne lumineuse */}
        <motion.div
          className="absolute top-1/2 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.9) 25%, rgba(57,255,20,0.5) 50%, rgba(139,92,246,0.9) 75%, transparent 100%)" }}
          animate={{ opacity: [0.15, 1, 0.15], scaleX: [0.5, 1.05, 0.5] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Particules sur la ligne */}
        {[
          { x: "15%", size: 5, delay: 0,   col: "bg-accent-violet" },
          { x: "30%", size: 3, delay: 0.7, col: "bg-accent-neon"   },
          { x: "50%", size: 7, delay: 0.2, col: "bg-accent-violet" },
          { x: "70%", size: 3, delay: 1.1, col: "bg-accent-neon"   },
          { x: "85%", size: 5, delay: 0.5, col: "bg-accent-violet" },
        ].map((p, i) => (
          <motion.div
            key={i}
            className={`absolute top-1/2 -translate-y-1/2 rounded-full ${p.col}/80`}
            style={{ left: p.x, width: p.size, height: p.size, boxShadow: `0 0 ${p.size * 3}px currentColor` }}
            animate={{ y: [0, -14, 0], opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2.4 + i * 0.25, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}
        {/* Halo central */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-10 rounded-full bg-accent-violet/18 blur-2xl"
          animate={{ scaleX: [0.7, 1.4, 0.7], opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-6 rounded-full bg-accent-neon/10 blur-xl"
          animate={{ scaleX: [1.3, 0.7, 1.3], opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* ══ AVIS · VIDÉO DÉMO · EXEMPLES ═════════════════════════════════
          Téléphone   : Exemples → Vidéo démo → Avis
          Ordinateur  : Avis → Vidéo démo → Exemples                        */}
      <div className="flex flex-col">

      {/* ══ AVIS CLIENTS ══════════════════════════════════════════════════ */}
      <section className="order-3 sm:order-1 py-5 sm:py-10 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-3 sm:mb-6 px-4"
        >
          <div className="flex items-center justify-center gap-1 mb-1 sm:mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2 text-white/60 text-[10px] sm:text-xs font-medium">4,9 / 5 — 2 300+ avis</span>
          </div>
          <h2 className="text-lg sm:text-3xl font-bold">
            Ils ont essayé, ils ont <span className="gradient-text">adoré</span>
          </h2>
        </motion.div>

        <ReviewsMarquee />
      </section>

      {/* ══ VIDÉO DÉMO ═══════════════════════════════════════════════════
          Téléphone : juste sous les exemples · Ordinateur : sous les avis */}
      <div className="order-2 sm:order-2">
        <DemoVideoSection />
      </div>

      {/* ══ GALERIE EXEMPLES ══════════════════════════════════════════════ */}
      {/* Téléphone : pt-2 + le pb-8 du hero = toujours 40 px sous le bouton « Essayer gratuitement » */}
      <section className="order-1 sm:order-3 pt-2 pb-6 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Fond teinté */}
        <div className="absolute inset-0 bg-surface/20 pointer-events-none" />
        {/* Orbe violet haut-gauche */}
        <motion.div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-accent-violet/12 blur-3xl pointer-events-none"
          animate={{ x: [0, 50, 0], y: [0, 35, 0], scale: [1, 1.25, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Orbe neon bas-droite */}
        <motion.div
          className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-accent-neon/8 blur-3xl pointer-events-none"
          animate={{ x: [0, -40, 0], y: [0, -25, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {/* Orbe violet centre-haut */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full bg-accent-violet/8 blur-2xl pointer-events-none"
          animate={{ scaleX: [0.8, 1.4, 0.8], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-3 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-5xl font-bold mb-2 sm:mb-4">
              Exemples de <span className="gradient-text">transformations</span>
            </h2>
            <p className="text-white/50 text-xs sm:text-lg max-w-xl mx-auto">
              Transformations en image et en vidéo, générées par IA.
            </p>
          </motion.div>

          <ExamplesGallery />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link href="/upload" className="btn-primary inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Créer ma transformation
            </Link>
          </motion.div>
        </div>{/* end max-w-7xl */}
      </section>

      </div>{/* end ordre Avis / Démo / Exemples */}

      {/* ══ FAQ ═══════════════════════════════════════════════════════════ */}
      <section className="py-7 sm:py-12 px-4 sm:px-6 bg-surface/20">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-4 sm:mb-8"
          >
            <h2 className="text-lg sm:text-3xl font-bold mb-1 sm:mb-2">
              Questions <span className="gradient-text">fréquentes</span>
            </h2>
            <p className="text-white/50 text-xs sm:text-base">
              Tout ce que vous devez savoir avant de commencer
            </p>
          </motion.div>

          <FaqAccordion />

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-white/40 text-[11px] sm:text-sm mt-5 sm:mt-8"
          >
            Une autre question ?{" "}
            <a href="mailto:contact@riseandclose.co" className="text-accent-violet hover:underline">
              Contactez-nous
            </a>
          </motion.p>
        </div>
      </section>

      {/* Le tuto Snap Rouge n'est plus sur la page d'accueil :
          il reste accessible uniquement depuis le Dashboard (/dashboard?view=snaprouge). */}

      <Footer />
    </div>
  );
}
