"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BeforeAfterSlider from "./components/BeforeAfterSlider";
import {
  Sparkles, Star, ArrowRight, Play,
  ChevronDown, Quote, Flame, Check,
} from "lucide-react";

// ─── DONNÉES ────────────────────────────────────────────────────────────────


const STATS = [
  { value: "4.9★", label: "Note moyenne" },
  { value: "<30s", label: "Temps moyen" },
  { value: "4K", label: "Résolution max" },
];

const REVIEWS = [
  { name: "Soph!_mtbl", city: "Paris", stars: 5, text: "Incroyable ! Ma photo avec Scarlett Johansson est tellement réaliste, je l'ai partagée sur Instagram et tout le monde pensait que c'était vrai." },
  { name: "Lucasss9378!", city: "Lyon", stars: 5, text: "La qualité est bluffante. En quelques secondes j'avais ma photo aux côtés de Leonardo DiCaprio. Je recommande vivement !" },
  { name: "Chl0E.BRZH", city: "Bordeaux", stars: 5, text: "Parfait pour les photos de profil. Celle avec Kylian Mbappé est ma préférée, le rendu est vraiment professionnel." },
  { name: "Max.xAm76", city: "Dijon", stars: 5, text: "J'utilise AstraCrea chaque semaine, ma dernière photo avec Denzel Washington est dingue. L'abonnement Pro en illimité, excellent rapport qualité/prix." },
  { name: "Em1.Rtbu", city: "Nantes", stars: 4, text: "Très bon service ! Seul petit bémol, parfois 40 secondes au lieu de 20 habituellement. Je pense que je vais passer à Ultra pour aller plus vite !" },
  { name: "ThomAss772ltrb", city: "Toulouse", stars: 5, text: "J'ai essayé d'autres outils, rien n'arrive à la cheville d'AstraCrea. Ma photo avec Mia Khalifa est d'une précision exceptionnelle." },
  { name: "Cam.sdr", city: "Strasbourg", stars: 5, text: "Ma photo avec Johnny Sins est trop bien. On dirait un vrai cliché pris sur le tapis rouge. Mes amis n'en reviennent pas !" },
  { name: "FelixStrxu", city: "Nice", stars: 5, text: "Simple, rapide, bluffant. Ma photo avec Leonardo DiCaprio a fait un carton sur mes réseaux. Le pipeline IA est vraiment au top." },
  { name: "Saitawann.94", city: "Paris", stars: 5, text: "La vérité c'est rapide, qualité et le résultat est direct au rendez-vous !" },

];

// Pour les exemples : mets tes vraies images dans /public/examples/
// Format : { style, before: "/examples/before1.jpg", after: "/examples/after1.jpg" }
// `mobile: true` = visible sur téléphone ; `mobileFirst` = affiché en premier sur téléphone.
// Sur ordinateur (sm+), tous les exemples restent visibles dans l'ordre du tableau.
const EXAMPLES_IMAGES = [
  { style: "Scarlett Johansson", before: "/examples/scarlett_johansson_avant.png", after: "/examples/scarlett_johansson_apres.png", mobile: false, mobileFirst: false },
  { style: "Mia Khalifa",   before: "/examples/mia_avant.png" , after: "/examples/mia_apres.png", mobile: true, mobileFirst: false },
  { style: "Leonardo DiCaprio",          before: "/examples/leonardo_dicaprio_avant.png", after: "/examples/leonardo_dicaprio_apres.png", mobile: false, mobileFirst: false },
  { style: "Denzel Washington",       before: "/examples/denzel_avant.png", after: "/examples/denzel_apres.png", mobile: false, mobileFirst: false },
  { style: "Johnny Sins",      before: "/examples/johnny_avant.png", after: "/examples/johnny_apres.png", mobile: false, mobileFirst: false },
  { style: "Kylian Mbappé",      before: "/examples/kylian_avant.png", after: "/examples/kylian_apres.png", mobile: true, mobileFirst: true },

];

// ─── VIDÉO DÉMO (section sous le hero) ──────────────────────────────────────
// Version PC (horizontale), affichée sur ordinateur ET téléphone.
const DEMO_VIDEO = "/videos/tuto-astra-horizontal.mp4";

const FAQ_ITEMS = [
  {
    q: "Mes photos sont-elles conservées ?",
    a: "Non. Votre photo originale est automatiquement supprimée de nos serveurs après traitement. Seule l'image générée est stockée dans votre historique, et vous pouvez la supprimer à tout moment.",
  },
  {
    q: "Puis-je utiliser n'importe quelle photo ?",
    a: "Oui, tant que le visage est bien visible, de face ou légèrement de profil, avec une bonne luminosité. Les photos floues, très sombres ou avec plusieurs visages donnent des résultats moins précis.",
  },
  {
    q: "Combien de générations puis-je faire ?",
    a: "Tous les abonnements incluent des générations illimitées. Sans abonnement, vous obtenez un aperçu flouté ; le rendu net en HD se débloque dès qu'un abonnement est actif.",
  },
  {
    q: "Quelle est la résolution finale des images ?",
    a: "Toutes les images sont générées puis upscalées x4 via RealESRGAN. La résolution finale atteint jusqu'à 4K (4096×4096 px) selon le style choisi.",
  },
];

// ─── COMPOSANTS INTERNES ────────────────────────────────────────────────────

// Images du fond du hero, dans /public/hero-gallery/.
// Les premières de chaque liste sont celles visibles à l'ouverture du site
// (ligne 1 défile vers la gauche, ligne 2 vers la droite).
const ROW1 = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
].map(n => `/hero-gallery/${n}.jpeg`);
const ROW2 = [
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
].map(n => `/hero-gallery/${n}.jpeg`);
// 3e ligne affichée UNIQUEMENT sur téléphone. Elle reprend les images paires
// des deux autres lignes, dans l'ordre inverse : rien n'est perdu sur
// ordinateur, qui garde ses 2 lignes complètes.
const ROW3 = [
  20, 18, 16, 14, 12, 10, 8, 6, 4, 2,
].map(n => `/hero-gallery/${n}.jpeg`);

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
            /* Tuiles réduites sur téléphone : les 3 lignes tiennent entièrement
               dans le hero. Taille d'origine conservée sur ordinateur. */
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
    <div className="absolute inset-0 overflow-hidden select-none pointer-events-none">
      {/* Fond noir de base */}
      <div className="absolute inset-0 bg-[#0D0D0D]" />

      {/* Lignes d'images depuis le haut */}
      <div
        className="absolute inset-0 flex flex-col justify-start gap-2 sm:gap-4"
        style={{ opacity: 0.7 }}
      >
        <ImageRow images={ROW1} direction="left" />
        <ImageRow images={ROW2} direction="right" />
        {/* 3e ligne : téléphone uniquement */}
        <div className="sm:hidden shrink-0">
          <ImageRow images={ROW3} direction="left" />
        </div>
      </div>

      {/* ── Overlays pour lisibilité du texte ── */}
      {/* Vignette générale */}
      <div className="absolute inset-0 bg-background/45" />
      {/* Fondu haut léger (navbar) */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/70 to-transparent" />
      {/* Dégradé noir — couvre la moitié basse de la 2e ligne */}
      {/* Dégradé bas — plus court sur téléphone pour laisser respirer la 3e ligne */}
      <div className="absolute bottom-0 left-0 right-0 h-[200px] sm:h-[320px] bg-gradient-to-t from-background from-40% via-background/80 to-transparent" />
      {/* Fondu gauche */}
      <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      {/* Fondu droite */}
      <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

/**
 * Bouton « Essayer gratuitement » animé.
 * Le halo est décalé vers l'extérieur et l'anneau clair détache le bouton du
 * fond : le texte reste lisible par-dessus les images de la galerie.
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
      {/* Halo diffus, décalé vers l'extérieur pour ne pas voiler le texte */}
      <motion.div
        aria-hidden
        className="absolute -inset-1.5 rounded-2xl bg-accent-violet/40 blur-xl pointer-events-none"
        animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.14, 0.5] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Anneau clair qui respire : détache le bouton du fond */}
      <motion.div
        aria-hidden
        className="absolute -inset-px rounded-xl border-2 border-white/70 pointer-events-none"
        animate={{ opacity: [0.75, 0.2, 0.75] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Battement lent, séparé du survol pour éviter tout à-coup */}
      <motion.div
        animate={{ scale: [1, 1.035, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
          <Link
            href="/dashboard"
            className={`btn-primary relative overflow-hidden font-bold tracking-wide flex items-center justify-center gap-2 group shadow-xl shadow-accent-violet/40 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)] ${
              fullWidth ? "w-full" : ""
            } ${className}`}
          >
            {/* Reflet qui balaie le bouton par intermittence */}
            <motion.span
              aria-hidden
              className="absolute inset-y-0 -left-1/4 w-1/4 -skew-x-12 bg-white/30 blur-md pointer-events-none"
              animate={{ x: ["0%", "520%"] }}
              transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" }}
            />
            <span className="relative">Essayer gratuitement</span>
            <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * Bouton « Essayer gratuitement » collant — TÉLÉPHONE UNIQUEMENT.
 * Tant que le bouton du hero est à l'écran, rien ne s'affiche. Dès que le
 * visiteur le dépasse en scrollant, le bouton se pose sous la navbar et suit
 * l'écran pour le reste de la page.
 */
function MobileStickyCta({ anchorRef }: { anchorRef: React.RefObject<HTMLDivElement | null> }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      // 64 px = hauteur de la navbar : on affiche dès que le bouton passe dessous.
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
          /* Sans fond : le bouton flotte au-dessus de la page, posé un peu plus
             bas que la navbar pour ne pas la toucher. */
          className="sm:hidden fixed top-[76px] left-0 right-0 z-40 px-4"
        >
          <AnimatedCta fullWidth className="py-3 text-base" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ReviewsMarquee() {
  return (
    <div className="relative overflow-hidden py-0.5 sm:py-4">
      {/* Fade gauche */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      {/* Fade droite */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div
        className="flex gap-5 w-max"
        style={{ animation: "marquee 40s linear infinite" }}
      >
        {[...REVIEWS, ...REVIEWS].map((review, i) => (
          <div
            key={i}
            className="w-56 sm:w-80 flex-shrink-0 card border border-surface-border p-2.5 sm:p-5 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex gap-1">
                {Array.from({ length: review.stars }).map((_, s) => (
                  <Star key={s} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-yellow-400 text-yellow-400" />
                ))}
                {Array.from({ length: 5 - review.stars }).map((_, s) => (
                  <Star key={s} className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/20" />
                ))}
              </div>
              <Quote className="w-4 h-4 text-accent-violet/40" />
            </div>
            <p className="text-white/70 text-[11px] sm:text-sm leading-relaxed mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-3">
              &ldquo;{review.text}&rdquo;
            </p>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-violet-neon flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {review.name.charAt(0)}
              </div>
              <div>
                <p className="text-white font-medium text-xs sm:text-sm leading-none">{review.name}</p>
                <p className="text-white/40 text-[10px] sm:text-xs mt-0.5">{review.city}</p>
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
  // Sur téléphone, seuls les exemples marqués `mobile` sont affichés au départ ;
  // « Voir plus » révèle les autres. Sur ordinateur, tout est visible d'emblée.
  const [showAll, setShowAll] = useState(false);
  const hiddenOnMobile = EXAMPLES_IMAGES.filter((ex) => !ex.mobile).length;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {EXAMPLES_IMAGES.map((ex, i) => (
          <motion.div
            key={ex.style}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className={`group relative rounded-2xl overflow-hidden border border-surface-border hover:border-accent-violet/50 transition-all duration-300 ${
              ex.mobile || showAll ? "" : "hidden sm:block"
            } ${ex.mobileFirst ? "order-first sm:order-none" : ""}`}
            style={{ aspectRatio: "9/16" }}
          >
            {ex.before && ex.after ? (
              <BeforeAfterSlider before={ex.before} after={ex.after} alt={ex.style} />
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

            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
              <p className="text-white text-xs sm:text-sm font-medium">{ex.style}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* « Voir plus » — téléphone uniquement : sur ordinateur, tous les
          exemples sont déjà affichés. */}
      {!showAll && hiddenOnMobile > 0 && (
        <div className="sm:hidden text-center mt-3">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-surface-border bg-surface text-white/70 text-xs font-medium transition-colors hover:text-white hover:border-accent-violet/40 active:scale-95"
          >
            Voir plus ({hiddenOnMobile})
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── SECTION VIDÉO DÉMO ─────────────────────────────────────────────────────

function DemoVideoSection() {
  // La vidéo (~7 Mo) n'est montée que lorsque la section approche de l'écran
  const videoZoneRef = useRef<HTMLDivElement>(null);
  const videoInView  = useInView(videoZoneRef, { once: true, margin: "300px" });

  return (
    <section id="demo" className="py-4 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
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
          className="text-center mb-3 sm:mb-10"
        >
          <span className="inline-flex items-center gap-2 bg-accent-violet/10 border border-accent-violet/30 text-accent-violet text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6">
            <Play className="w-4 h-4 fill-current" />
            Démonstration
          </span>
          <h2 className="text-lg sm:text-5xl font-bold mb-1.5 sm:mb-4">
            Voyez la magie <span className="gradient-text">en action</span>
          </h2>
          <p className="text-white/50 text-xs sm:text-lg max-w-xl mx-auto">
            De la photo originale au résultat final : découvrez AstraCrea en vidéo
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

// ─── SECTION TUTO SNAP ROUGE ────────────────────────────────────────────────

function SnapRougeTutoSection() {
  return (
    <section className="py-4 sm:py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Ambiance rouge */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[500px] h-[180px] sm:h-[300px] rounded-full bg-red-500/8 blur-[100px] pointer-events-none"
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-accent-violet/8 blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-2.5 sm:mb-8"
        >
          <span className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-full mb-2 sm:mb-4">
            <Flame className="w-3.5 h-3.5" />
            Tuto Snapchat
          </span>
          <h2 className="text-base sm:text-3xl font-bold mb-1.5 sm:mb-3">
            Envoyer un <span className="text-red-500">Snap Rouge</span> 🔥
          </h2>
          <p className="text-white/50 text-[11px] sm:text-base max-w-2xl mx-auto">
            Envoyez vos créations IA comme de vrais Snaps pris sur le moment —
            la technique complète en vidéo vous attend dans votre Dashboard.
          </p>
        </motion.div>

        {/* Snap violet vs Snap Rouge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 max-w-3xl mx-auto mb-2.5 sm:mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-surface-border bg-surface p-2.5 sm:p-4"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
              <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-xs sm:text-base">💜</span>
              <p className="font-black text-sm sm:text-base text-white/70">Snap violet</p>
            </div>
            <p className="text-white/45 text-[10px] sm:text-xs leading-relaxed">
              Une photo envoyée depuis la galerie apparaît en <strong className="text-white/70">violet</strong> :
              tout le monde voit immédiatement que ce n&apos;est pas une photo prise sur le moment.
              L&apos;effet de surprise est ruiné.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-red-500/40 bg-red-500/5 p-2.5 sm:p-4 relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-red-500/15 blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3 relative">
              <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-xs sm:text-base">🔴</span>
              <p className="font-black text-sm sm:text-base text-red-400">Snap Rouge</p>
            </div>
            <p className="text-white/55 text-[10px] sm:text-xs leading-relaxed relative">
              Avec notre technique, votre création IA part en <strong className="text-red-400">Snap Rouge</strong> —
              exactement comme une photo prise en direct avec l&apos;appareil photo.
              Effet garanti auprès de vos amis. 🔥
            </p>
          </motion.div>
        </div>

        {/* Ce que vous obtenez */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-1 sm:gap-2 max-w-3xl mx-auto mb-2.5 sm:mb-8"
        >
          {[
            "Vidéo exclusive de la technique",
            "Fonctionne sur iPhone et Android",
            "Accès à vie — payez une seule fois",
          ].map(label => (
            <span key={label} className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] sm:text-xs font-medium">
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              {label}
            </span>
          ))}
        </motion.div>

        {/* CTA vers le Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link
            href="/dashboard?view=snaprouge"
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs sm:text-base transition-all shadow-lg shadow-red-500/25 hover:scale-[1.03] active:scale-[0.97]"
          >
            <Flame className="w-4 h-4" />
            Débloquer la technique complète
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-white/30 text-[10px] sm:text-xs mt-2 sm:mt-3">
            Inclus avec les abonnements <span className="text-accent-violet font-semibold">Pro</span> et{" "}
            <span className="text-amber-400 font-semibold">Elite</span>, ou en accès unique
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-1.5 sm:space-y-3">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
              isOpen ? "border-accent-violet/50 bg-accent-violet/5" : "border-surface-border bg-surface"
            }`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3.5 text-left group"
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
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <p className="px-3.5 sm:px-5 pb-3 sm:pb-4 text-white/60 leading-relaxed text-[11px] sm:text-sm">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── PAGE PRINCIPALE ────────────────────────────────────────────────────────

export default function HomePage() {
  // Repère du bouton « Essayer gratuitement » du hero : sert à déclencher
  // la version collante sur téléphone une fois qu'on l'a dépassé.
  const heroCtaRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <MobileStickyCta anchorRef={heroCtaRef} />

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="order-1 sm:order-none relative min-h-[70vh] sm:min-h-screen flex items-center justify-center overflow-hidden">
        <HeroImageBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-8 sm:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 bg-accent-violet/10 border border-accent-violet/30 text-accent-violet text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-8">
              <Sparkles className="w-4 h-4" />
              Technologie IA de pointe
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[1.6rem] sm:text-7xl lg:text-8xl font-black leading-tight mb-3 sm:mb-6"
          >
            Fake It{" "}
            <span className="gradient-text">Until You</span>
            <br />
            <span className="text-white/90">Make It</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xs sm:text-2xl text-white/60 max-w-2xl mx-auto mb-6 sm:mb-12"
          >
            Photos avec les célébrités et les personnalités que vous admirez :
            montrez la vie que vous voulez.
          </motion.p>

          <motion.div
            ref={heroCtaRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-16"
          >
            <AnimatedCta className="text-base sm:text-lg px-7 sm:px-9 py-3 sm:py-4" />
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <a href="#demo" className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
                <Play className="w-5 h-5 fill-current" />
                Voir la démo
              </a>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-3 gap-3 sm:gap-6 max-w-xs sm:max-w-xl mx-auto"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl sm:text-3xl font-black gradient-text">{stat.value}</div>
                <div className="text-white/50 text-[11px] sm:text-sm mt-0.5 sm:mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ VIDÉO DÉMO ═══════════════════════════════════════════════════ */}
      {/* Téléphone : passe après les exemples de transformations */}
      <div className="order-3 sm:order-none">
        <DemoVideoSection />
      </div>

      {/* ══ SÉPARATEUR ANIMÉ HERO → AVIS ════════════════════════════════ */}
      <div className="order-4 sm:order-none relative h-6 sm:h-28 overflow-hidden pointer-events-none select-none">
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

      {/* ══ AVIS CLIENTS ══════════════════════════════════════════════════ */}
      <section className="order-5 sm:order-none py-4 sm:py-20 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-3 sm:mb-12 px-4"
        >
          <div className="flex items-center justify-center gap-1 mb-2 sm:mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2 text-white/60 text-xs sm:text-sm font-medium">4,9 / 5 — 2 300+ avis</span>
          </div>
          <h2 className="text-lg sm:text-5xl font-bold mb-1.5 sm:mb-3">
            Ils ont essayé, ils ont <span className="gradient-text">adoré</span>
          </h2>
          <p className="text-white/50 text-xs sm:text-lg max-w-xl mx-auto">
            Des milliers d&apos;utilisateurs transforment leurs photos chaque jour
          </p>
        </motion.div>

        <ReviewsMarquee />
      </section>

      {/* ══ GALERIE EXEMPLES ══════════════════════════════════════════════ */}
      <section className="order-2 sm:order-none py-4 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
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
            <h2 className="text-lg sm:text-5xl font-bold mb-1.5 sm:mb-4">
              Exemples de <span className="gradient-text">transformations</span>
            </h2>
            <p className="text-white/50 text-xs sm:text-lg max-w-xl mx-auto">
              La barre glisse toute seule pour révéler la transformation — attrapez-la pour comparer à votre rythme.
            </p>
          </motion.div>

          <ExamplesGallery />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-4 sm:mt-10"
          >
            <Link href="/upload" className="btn-primary inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Créer ma transformation
            </Link>
          </motion.div>
        </div>{/* end max-w-7xl */}
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════════════════════ */}
      <section className="order-6 sm:order-none py-4 sm:py-12 px-4 sm:px-6 bg-surface/20">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-2.5 sm:mb-8"
          >
            <h2 className="text-base sm:text-3xl font-bold mb-1.5 sm:mb-2">
              Questions <span className="gradient-text">fréquentes</span>
            </h2>
            <p className="text-white/50 text-[11px] sm:text-base">
              Tout ce que vous devez savoir avant de commencer
            </p>
          </motion.div>

          <FaqAccordion />

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-white/40 text-[11px] sm:text-sm mt-3 sm:mt-8"
          >
            Une autre question ?{" "}
            <a href="mailto:contact@riseandclose.co" className="text-accent-violet hover:underline">
              Contactez-nous
            </a>
          </motion.p>
        </div>
      </section>

      {/* ══ TUTO SNAP ROUGE ══════════════════════════════════════════════ */}
      <div className="order-7 sm:order-none">
        <SnapRougeTutoSection />
      </div>

      <div className="order-8 sm:order-none">
        <Footer />
      </div>
    </div>
  );
}
