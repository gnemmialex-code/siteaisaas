"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BeforeAfterSlider from "./components/BeforeAfterSlider";
import {
  Sparkles, Star, ArrowRight, Play,
  ChevronDown, Quote, ImageIcon, Film, Flame, Check,
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
  { name: "Max.xAm76", city: "Dijon", stars: 5, text: "J'utilise AstraCrea chaque semaine. Les crédits Pro suffisent largement, excellent rapport qualité/prix." },
  { name: "Em1.Rtbu", city: "Nantes", stars: 4, text: "Très bon service ! Seul petit bémol, parfois 40 secondes au lieu de 20 habituellement. Je pense que je vais passer à Ultra pour aller plus vite !" },
  { name: "ThomAss772ltrb", city: "Toulouse", stars: 5, text: "J'ai essayé d'autres outils, rien n'arrive à la cheville d'AstraCrea. La précision de la transformation est exceptionnelle." },
  { name: "Cam.sdr", city: "Strasbourg", stars: 5, text: "Le style Met Gala est trop bien. On dirait une vraie photo de gala. Mes amis n'en reviennent pas !" },
  { name: "FelixStrxu", city: "Nice", stars: 5, text: "Simple, rapide, bluffant. Je l'utilise pour mes contenus créatifs. Le pipeline IA est vraiment au top." },
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

// Vidéos : remplis youtubeId OU localSrc (pas les deux)
// localSrc : mets ta vidéo dans /public/videos/ et indique le chemin ex: "/videos/demo.mp4"
const EXAMPLES_VIDEOS = [
  { title: "En maillot de bain", youtubeId: null, localSrc: "/videos/maillot.mp4" },
  { title: "Présentation de l'outfit",     youtubeId: null, localSrc: "/videos/outfit.mp4" },
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
    q: "Les crédits expirent-ils ?",
    a: "Non, vos crédits n'ont pas de date d'expiration. Achetez-en une fois, utilisez-les à votre rythme.",
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
  "img35", "img36", "img37", "img38", "img39", "img40",
  "img11", "img12", "img13", "img14", "img02", "img09",
].map(n => `/hero-gallery/${n}.png`);
const ROW2 = [
  "img41", "img42", "img43", "img44", "img45", "img46",
  "img31", "img32", "img33", "img21", "img23", "img24", "img25", "img27",
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
    <div className="overflow-hidden w-full">
      <div className={direction === "left" ? "animate-scroll-left" : "animate-scroll-right"}
        style={{ display: "flex", gap: "12px", width: "max-content" }}
      >
        {doubled.map((src, i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-xl overflow-hidden"
            style={{ width: 300, height: 500 }}
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
        className="absolute inset-0 flex flex-col justify-start gap-4"
        style={{ opacity: 0.7 }}
      >
        <ImageRow images={ROW1} direction="left" />
        <ImageRow images={ROW2} direction="right" />
      </div>

      {/* ── Overlays pour lisibilité du texte ── */}
      {/* Vignette générale */}
      <div className="absolute inset-0 bg-background/45" />
      {/* Fondu haut léger (navbar) */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/70 to-transparent" />
      {/* Dégradé noir — couvre la moitié basse de la 2e ligne */}
      <div className="absolute bottom-0 left-0 right-0 h-[320px] bg-gradient-to-t from-background from-40% via-background/80 to-transparent" />
      {/* Fondu gauche */}
      <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      {/* Fondu droite */}
      <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

function ReviewsMarquee() {
  return (
    <div className="relative overflow-hidden py-4">
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
            className="w-80 flex-shrink-0 card border border-surface-border p-5 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1">
                {Array.from({ length: review.stars }).map((_, s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                ))}
                {Array.from({ length: 5 - review.stars }).map((_, s) => (
                  <Star key={s} className="w-3.5 h-3.5 text-white/20" />
                ))}
              </div>
              <Quote className="w-4 h-4 text-accent-violet/40" />
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-3">
              &ldquo;{review.text}&rdquo;
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-violet-neon flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {review.name.charAt(0)}
              </div>
              <div>
                <p className="text-white font-medium text-sm leading-none">{review.name}</p>
                <p className="text-white/40 text-xs mt-0.5">{review.city}</p>
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

  return (
    <div>
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
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {EXAMPLES_VIDEOS.map((vid, i) => (
              <motion.div
                key={vid.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl overflow-hidden border border-surface-border"
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
    </div>
  );
}

// ─── SECTION VIDÉO DÉMO ─────────────────────────────────────────────────────

function DemoVideoSection() {
  // La vidéo (~7 Mo) n'est montée que lorsque la section approche de l'écran
  const videoZoneRef = useRef<HTMLDivElement>(null);
  const videoInView  = useInView(videoZoneRef, { once: true, margin: "300px" });

  return (
    <section id="demo" className="py-24 px-4 sm:px-6 relative overflow-hidden">
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
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 bg-accent-violet/10 border border-accent-violet/30 text-accent-violet text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <Play className="w-4 h-4 fill-current" />
            Démonstration
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Voyez la magie <span className="gradient-text">en action</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
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
    <section className="py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Ambiance rouge */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-red-500/8 blur-[100px] pointer-events-none"
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-accent-violet/8 blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Flame className="w-3.5 h-3.5" />
            Tuto Snapchat
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Envoyer un <span className="text-red-500">Snap Rouge</span> 🔥
          </h2>
          <p className="text-white/50 text-base max-w-2xl mx-auto">
            Envoyez vos créations IA comme de vrais Snaps pris sur le moment —
            la technique complète en vidéo vous attend dans votre Dashboard.
          </p>
        </motion.div>

        {/* Snap violet vs Snap Rouge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-surface-border bg-surface p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-base">💜</span>
              <p className="font-black text-base text-white/70">Snap violet</p>
            </div>
            <p className="text-white/45 text-xs leading-relaxed">
              Une photo envoyée depuis la galerie apparaît en <strong className="text-white/70">violet</strong> :
              tout le monde voit immédiatement que ce n&apos;est pas une photo prise sur le moment.
              L&apos;effet de surprise est ruiné.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-red-500/40 bg-red-500/5 p-4 relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-red-500/15 blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-3 relative">
              <span className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-base">🔴</span>
              <p className="font-black text-base text-red-400">Snap Rouge</p>
            </div>
            <p className="text-white/55 text-xs leading-relaxed relative">
              Avec notre technique, votre création IA part en <strong className="text-red-400">Snap Rouge</strong> —
              exactement comme une photo prise en direct avec l&apos;appareil photo.
              Effet garanti auprès de vos amis. 🔥
            </p>
          </motion.div>
        </div>

        {/* Étapes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto mb-6">
          {[
            { step: "01", title: "Créez votre photo IA", desc: "Générez votre transformation sur AstraCrea et téléchargez-la en haute qualité" },
            { step: "02", title: "Débloquez la technique", desc: "Guide vidéo complet, étape par étape — iPhone et Android" },
            { step: "03", title: "Envoyez en Snap Rouge", desc: "Votre photo part comme un vrai Snap pris sur le moment" },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-surface-border bg-surface p-4 relative overflow-hidden"
            >
              <span className="text-3xl font-black text-red-500/15 absolute top-2 right-3">{item.step}</span>
              <h3 className="font-bold text-white text-sm mb-1.5 relative">{item.title}</h3>
              <p className="text-white/45 text-xs leading-relaxed relative">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Ce que vous obtenez */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto mb-8"
        >
          {[
            "Vidéo exclusive de la technique",
            "Fonctionne sur iPhone et Android",
            "Accès à vie — payez une seule fois",
          ].map(label => (
            <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium">
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-base transition-all shadow-lg shadow-red-500/25 hover:scale-[1.03] active:scale-[0.97]"
          >
            <Flame className="w-4 h-4" />
            Débloquer la technique complète
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-white/30 text-xs mt-3">
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
    <div className="space-y-3">
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
              className="w-full flex items-center justify-between px-5 py-3.5 text-left group"
            >
              <span className={`font-semibold text-sm transition-colors ${isOpen ? "text-white" : "text-white/80 group-hover:text-white"}`}>
                {item.q}
              </span>
              <ChevronDown
                className={`w-5 h-5 flex-shrink-0 ml-4 transition-all duration-300 ${
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
                  <p className="px-5 pb-4 text-white/60 leading-relaxed text-sm">
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
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <HeroImageBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 bg-accent-violet/10 border border-accent-violet/30 text-accent-violet text-sm font-medium px-4 py-2 rounded-full mb-8">
              <Sparkles className="w-4 h-4" />
              Technologie IA de pointe
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-black leading-tight mb-6"
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
            className="text-xl sm:text-2xl text-white/60 max-w-2xl mx-auto mb-12"
          >
            Photos avec des célébrités, tenues et montres de luxe :
            montrez la vie que vous voulez. Résultats 4K ultra-réalistes
            en moins de 30 secondes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-xl bg-accent-violet/50 blur-lg pointer-events-none"
                animate={{ scale: [1, 1.25, 1], opacity: [0.55, 0.15, 0.55] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="relative">
                <Link href="/dashboard" className="btn-primary text-lg px-8 py-4 flex items-center gap-2 group">
                  Essayer gratuitement
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
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
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto"
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

      {/* ══ VIDÉO DÉMO ═══════════════════════════════════════════════════ */}
      <DemoVideoSection />

      {/* ══ SÉPARATEUR ANIMÉ HERO → AVIS ════════════════════════════════ */}
      <div className="relative h-28 overflow-hidden pointer-events-none select-none">
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
      <section className="py-20 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 px-4"
        >
          <div className="flex items-center justify-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2 text-white/60 text-sm font-medium">4,9 / 5 — 2 300+ avis</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-3">
            Ils ont essayé, ils ont <span className="gradient-text">adoré</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Des milliers d&apos;utilisateurs transforment leurs photos chaque jour
          </p>
        </motion.div>

        <ReviewsMarquee />
      </section>

      {/* ══ GALERIE EXEMPLES ══════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
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
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Exemples de <span className="gradient-text">transformations</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Passez la souris sur les photos pour voir la transformation. Regardez les vidéos pour voir en action - en cours d'amélioration.
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

      {/* ══ FAQ ═══════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 sm:px-6 bg-surface/20">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Questions <span className="gradient-text">fréquentes</span>
            </h2>
            <p className="text-white/50 text-base">
              Tout ce que vous devez savoir avant de commencer
            </p>
          </motion.div>

          <FaqAccordion />

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-white/40 text-sm mt-8"
          >
            Une autre question ?{" "}
            <a href="mailto:contact@riseandclose.co" className="text-accent-violet hover:underline">
              Contactez-nous
            </a>
          </motion.p>
        </div>
      </section>

      {/* ══ TUTO SNAP ROUGE ══════════════════════════════════════════════ */}
      <SnapRougeTutoSection />

      <Footer />
    </div>
  );
}
