"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Sparkles, Download, Trash2, Zap, LogOut,
  Shuffle, Film, Crown, Settings, History,
  ChevronRight, ChevronLeft, ChevronDown, Check, Star, Replace, PlusCircle, AlertCircle, StopCircle, Lock,
  Gift, Flame, Copy, LogIn, UserPlus, Users, Loader2, ExternalLink, Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isPaidPlan } from "@/lib/plan";
import { resizeImageFile, getSupportedAspectRatio } from "@/lib/resize-image";
import { WATCH_OPTIONS, WATCH_BRANDS } from "@/lib/watch-options";
import UploadBox from "../components/UploadBox";
import VideoUploadBox from "../components/VideoUploadBox";
import { STYLES, Style } from "../components/StyleSelector";
import LiveNotification from "../components/LiveNotification";

/* ─── Refinement options ─────────────────────────────────── */
interface OptionItem { id: string; label: string; prompt: string; }

const CLOTHING_OPTIONS: OptionItem[] = [
  { id: "casual",        label: "👕 Casual chic",    prompt: "casual chic outfit, relaxed stylish attire" },
  { id: "formal_suit",   label: "🤵 Costume formel", prompt: "wearing a formal suit, sharp elegant attire" },
  { id: "elegant_dress", label: "👗 Robe élégante",  prompt: "wearing an elegant evening dress, glamorous" },
  { id: "streetwear",    label: "🧢 Streetwear",     prompt: "streetwear urban fashion, trendy look" },
  { id: "haute_couture", label: "✨ Haute couture",  prompt: "haute couture designer fashion, luxury outfit" },
  { id: "sporty",        label: "⚡ Sportswear",     prompt: "athletic sportswear, dynamic sporty look" },
];

const MOOD_OPTIONS: OptionItem[] = [
  { id: "glamour",      label: "💫 Glamour",      prompt: "glamorous confident stunning expression" },
  { id: "edgy",         label: "🖤 Edgy",          prompt: "edgy rock aesthetic, intense bold look" },
  { id: "romantic",     label: "🌸 Romantique",    prompt: "romantic soft aesthetic, gentle warm expression" },
  { id: "professional", label: "💼 Pro",           prompt: "professional confident businesslike look" },
  { id: "mysterious",   label: "🌙 Mystérieux",    prompt: "mysterious alluring dark expression" },
  { id: "futuristic",   label: "🤖 Futuriste",     prompt: "futuristic cyberpunk aesthetic, neon vibes" },
];

const BACKGROUND_OPTIONS: OptionItem[] = [
  { id: "studio",     label: "⬜ Studio",     prompt: "clean professional studio background" },
  { id: "city_night", label: "🌃 Ville nuit", prompt: "nighttime cityscape background, bokeh lights" },
  { id: "nature",     label: "🌿 Nature",     prompt: "lush green nature outdoor background" },
  { id: "luxury",     label: "💎 Luxe",       prompt: "luxury opulent interior background" },
  { id: "beach",      label: "🏖️ Plage",      prompt: "golden hour tropical beach background" },
  { id: "abstract",   label: "🎨 Abstrait",   prompt: "abstract colorful artistic background" },
];

const ACCESSORY_OPTIONS: OptionItem[] = [
  { id: "none",       label: "❌ Aucun",      prompt: "" },
  { id: "sunglasses", label: "🕶️ Lunettes",   prompt: "wearing stylish designer sunglasses" },
  { id: "jewelry",    label: "💍 Bijoux",     prompt: "wearing luxury gold jewelry and accessories" },
  { id: "hat",        label: "🎩 Chapeau",    prompt: "wearing a stylish fashionable hat" },
  { id: "scarf",      label: "🧣 Écharpe",    prompt: "wearing an elegant silk scarf" },
];

/* ─── Generation precision options ──────────────────────── */
interface GenOption { id: string; label: string; tier?: "pro" | "elite"; }

const RENDER_STYLE_OPTIONS: GenOption[] = [
  { id: "photoreal", label: "📷 Photoréaliste" },
  { id: "magazine",  label: "📰 Magazine",   tier: "pro"   },
  { id: "cinematic", label: "🎬 Cinématique", tier: "pro"   },
  { id: "artistic",  label: "🎨 Artistique",  tier: "pro"   },
];

const INTENSITY_OPTIONS: GenOption[] = [
  { id: "light",    label: "🌿 Légère"              },
  { id: "moderate", label: "⚖️ Modérée"             },
  { id: "strong",   label: "🔥 Intense",  tier: "pro"   },
  { id: "ultra",    label: "⚡ Ultra",    tier: "elite" },
];

function planQualityBadge(plan?: string): { label: string; color: string } {
  if (plan?.includes("ultra")) return { label: "8K Elite ✨", color: "text-amber-400 border-amber-400/40 bg-amber-400/10" };
  if (plan?.includes("pro"))   return { label: "4K Pro ⚡",   color: "text-accent-violet border-accent-violet/40 bg-accent-violet/10" };
  return { label: "HD 1080p",                                  color: "text-white/40 border-surface-border bg-surface-hover" };
}

/* Voile flouté permanent posé PAR-DESSUS l'image (backdrop-filter).
   Contrairement au `filter: blur()` d'une <img>, qui saute lors d'un repaint
   GPU (survol souris sur PC, scroll sur mobile) et laisse l'image nette un
   instant, backdrop-filter reste stable : la couche est toujours peinte, donc
   l'image dessous ne peut jamais réapparaître nette. */
function BlurVeil({ strong = false }: { strong?: boolean }) {
  const px = strong ? 48 : 24;
  return (
    <div
      aria-hidden
      className="absolute inset-0 z-10 pointer-events-none"
      style={{ backdropFilter: `blur(${px}px)`, WebkitBackdropFilter: `blur(${px}px)` }}
    />
  );
}

/* Cadenas + appel à l'action affichés par-dessus une image floutée (compte gratuit) */
function LockedOverlay({ onUnlock, compact = false, signup = false }: { onUnlock: () => void; compact?: boolean; signup?: boolean }) {
  const CTAIcon = signup ? UserPlus : Crown;
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 text-center p-3 bg-black/30">
      <div className={`rounded-2xl bg-accent-violet/20 border border-accent-violet/40 flex items-center justify-center ${compact ? "w-9 h-9" : "w-14 h-14"}`}>
        <Lock className={compact ? "w-4 h-4 text-accent-violet" : "w-7 h-7 text-accent-violet"} />
      </div>
      {!compact && (
        <>
          <p className="text-white font-bold text-sm max-w-[260px]">Aperçu flouté</p>
          <p className="text-white/70 text-xs max-w-[260px] leading-relaxed">
            {signup
              ? "Créez un compte gratuit pour continuer et révéler votre image."
              : "Passez à une formule pour révéler votre image en haute définition."}
          </p>
        </>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onUnlock(); }}
        className={`btn-primary flex items-center justify-center gap-1.5 font-semibold ${compact ? "px-2.5 py-1 text-[11px]" : "px-4 py-2 text-sm mt-1"}`}
      >
        <CTAIcon className={compact ? "w-3 h-3" : "w-4 h-4"} />
        {signup ? "S'inscrire" : "Débloquer"}
      </button>
    </div>
  );
}

/* ─── Vidéo IA : limites d'upload ─────────────────────────
   L'upload passe en direct vers Supabase Storage (la limite de corps de
   requête des fonctions Vercel (~4,5 Mo) interdit de passer par l'API). */
const MAX_VIDEO_MB      = 70;
const MAX_VIDEO_SECONDS = 10;

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(v.duration); };
    v.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Vidéo illisible")); };
    v.src = url;
  });
}

function userPlanTier(plan?: string): "essentiel" | "pro" | "elite" {
  if (!plan) return "essentiel";
  const p = plan.toLowerCase();
  if (p.includes("ultra") || p.includes("elite")) return "elite";
  if (p.includes("pro")) return "pro";
  return "essentiel";
}


function GenOptionChips({ title, options, selected, onSelect, planTier, onLocked }: {
  title: string; options: GenOption[]; selected: string | null;
  onSelect: (id: string) => void;
  planTier?: "essentiel" | "pro" | "elite";
  onLocked?: (requiredPlan: "pro" | "elite", feature: string) => void;
}) {
  const isLocked = (opt: GenOption) => {
    if (!opt.tier) return false;
    if (opt.tier === "elite" && planTier !== "elite") return true;
    if (opt.tier === "pro"   && planTier === "essentiel") return true;
    return false;
  };
  return (
    <div>
      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const locked = isLocked(opt);
          return (
            <button key={opt.id}
              onClick={() => locked
                ? onLocked?.(opt.tier as "pro" | "elite", `${title} — ${opt.label}`)
                : onSelect(opt.id)
              }
              title={locked ? `Disponible avec le plan ${opt.tier === "elite" ? "Elite" : "Pro"}` : undefined}
              className={`relative px-2.5 py-1 rounded-full text-xs font-medium border transition-all [@media(hover:hover)]:hover:scale-110 [@media(hover:hover)]:hover:z-10 ${
                locked
                  ? "border-surface-border text-white/20 cursor-pointer line-through"
                  : selected === opt.id
                  ? "bg-accent-violet/20 border-accent-violet text-white"
                  : "border-surface-border text-white/45 hover:border-accent-violet/40 hover:text-white"
              }`}>
              {locked && <Lock className="inline w-2.5 h-2.5 mr-0.5 mb-px" />}
              {opt.label}
              {locked && opt.tier && (
                <span className={`ml-1 text-[8px] font-bold ${opt.tier === "elite" ? "text-amber-400/60" : "text-accent-violet/60"}`}>
                  {opt.tier === "elite" ? "Elite" : "Pro"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function buildEnrichedPrompt(
  style: Style | null,
  clothing: string | null,
  mood: string | null,
  bg: string | null,
  accessory: string | null,
): string {
  const parts: string[] = [];
  if (style) parts.push(style.prompt);
  const cp = CLOTHING_OPTIONS.find(o => o.id === clothing)?.prompt;
  if (cp) parts.push(cp);
  const mp = MOOD_OPTIONS.find(o => o.id === mood)?.prompt;
  if (mp) parts.push(mp);
  const bp = BACKGROUND_OPTIONS.find(o => o.id === bg)?.prompt;
  if (bp) parts.push(bp);
  const ap = ACCESSORY_OPTIONS.find(o => o.id === accessory)?.prompt;
  if (ap && accessory !== "none") parts.push(ap);
  return parts.join(", ");
}

function DashOptionChips({ title, options, selected, onSelect, lockedPlan, onLocked }: {
  title: string; options: OptionItem[]; selected: string | null;
  onSelect: (id: string | null) => void;
  lockedPlan?: "pro" | "elite" | null;
  onLocked?: (requiredPlan: "pro" | "elite", feature: string) => void;
}) {
  return (
    <div className="relative">
      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button key={opt.id}
            onClick={() => lockedPlan
              ? onLocked?.(lockedPlan, title)
              : onSelect(selected === opt.id ? null : opt.id)
            }
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              lockedPlan
                ? "border-surface-border text-white/20 cursor-pointer line-through"
                : selected === opt.id
                ? "bg-accent-violet/20 border-accent-violet text-white"
                : "border-surface-border text-white/45 hover:border-accent-violet/40 hover:text-white"
            }`}>
            {lockedPlan && <Lock className="inline w-2.5 h-2.5 mr-0.5 mb-px" />}
            {opt.label}
          </button>
        ))}
      </div>
      {lockedPlan && (
        <div
          className="absolute inset-0 cursor-pointer flex items-center justify-end pr-1"
          onClick={() => onLocked?.(lockedPlan, title)}
        >
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${lockedPlan === "elite" ? "bg-amber-400/20 text-amber-400" : "bg-accent-violet/20 text-accent-violet"}`}>
            {lockedPlan === "elite" ? "Elite" : "Pro"}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Types ─────────────────────────────────────────────── */
type NavView = "create" | "history" | "referral" | "snaprouge" | "subscription" | "settings";
type GenType = "create" | "swapface" | "video";
type ObjectOption = "addObject" | "fullGeneration" | "replaceObject";

interface Generation {
  id: string;
  output_image_url: string;
  input_image_url: string;
  style: string;
  created_at: string;
}
interface UserStats {
  credits: number;
  total_generations: number;
  image_generations: number;
  swapface_generations: number;
  video_generations: number;
  member_since: string;
  plan?: string;
  snap_rouge?: boolean;
}

interface ReferralInfo {
  code: string;
  referrals: number;
  credits_earned: number;
}

/* ─── Constants ─────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "create"       as NavView, label: "Créer",        icon: Sparkles, desc: "Nouvelle génération"   },
  { id: "history"      as NavView, label: "Historique",   icon: History,  desc: "Mes créations"         },
  { id: "referral"     as NavView, label: "Parrainage",   icon: Gift,     desc: "Invitez vos amis"      },
  { id: "snaprouge"    as NavView, label: "Snap Rouge",   icon: Flame,    desc: "La technique secrète"  },
  { id: "subscription" as NavView, label: "Abonnement",   icon: Crown,    desc: "Nos formules"          },
  { id: "settings"     as NavView, label: "Paramètres",   icon: Settings, desc: "Mon compte"            },
];

const GEN_TABS: { id: GenType; label: string; icon: React.ElementType }[] = [
  { id: "create",   label: "Créer",    icon: Sparkles },
  { id: "video",    label: "Vidéo IA", icon: Film     },
];

// features : `strong: true` = différence majeure (vitesse, qualité, crédits…) affichée en blanc et en gras
const PLANS_DATA = [
  {
    id: "essentiel", name: "Essentiel", icon: Zap,   price: "9,90€",  credits: "2 500",
    color: "border-surface-border", badgeBg: "bg-white/10", badgeText: "text-white/60",
    highlights: [{ k: "Qualité", v: "HD 1080p" }, { k: "Vitesse", v: "~45-60s" }, { k: "Vidéo", v: "Non" }],
    features: [
      { t: "Qualité HD 1080p", strong: true },
      { t: "Générations illimitées", strong: true },
      { t: "Vitesse standard ~45-60s", strong: true },
      { t: "Photo uniquement (pas de vidéo, pas de SwapFace)" },
      { t: "8 styles disponibles" },
      { t: "Historique conservé 48h" },
      { t: "Support standard 48-72h" },
    ],
  },
  {
    id: "pro",        name: "Pro",        icon: Star,  price: "19,90€", credits: "10 250",
    color: "border-surface-border", badgeBg: "bg-accent-violet/20", badgeText: "text-accent-violet",
    badge: "Populaire",
    highlights: [{ k: "Qualité", v: "Ultra 4K" }, { k: "Vitesse", v: "~20-30s" }, { k: "Vidéo", v: "5s" }],
    features: [
      { t: "Qualité Ultra 4K", strong: true },
      { t: "Générations illimitées", strong: true },
      { t: "Vitesse rapide ~20-30s", strong: true },
      { t: "Photo + SwapFace + Vidéo jusqu'à 5s", strong: true },
      { t: "🔥 Technique Snap Rouge incluse" },
      { t: "13 styles dont 5 exclusifs Pro" },
      { t: "Historique conservé 48h" },
      { t: "Support prioritaire 24h" },
    ],
  },
  {
    id: "elite",      name: "Elite",      icon: Crown, price: "39,90€", credits: "Illimité",
    color: "border-amber-400/50", badgeBg: "bg-amber-400/20", badgeText: "text-amber-400",
    badge: "Elite",
    highlights: [{ k: "Qualité", v: "8K Photo" }, { k: "Vitesse", v: "~10-15s" }, { k: "Vidéo", v: "30s 4K" }],
    features: [
      { t: "Qualité 8K Photoréaliste", strong: true },
      { t: "Générations illimitées", strong: true },
      { t: "Vitesse maximale ~10-15s", strong: true },
      { t: "Photo + SwapFace + Vidéo 4K jusqu'à 30s", strong: true },
      { t: "🔥 Technique Snap Rouge incluse" },
      { t: "Tous les styles + 3 exclusifs Elite" },
      { t: "Historique conservé 48h" },
      { t: "Manager dédié + API illimitée" },
    ],
  },
];

/* ─── Particules montantes (fond noir de la vue Formules) ── */
function RisingParticles() {
  // Valeurs déterministes (pas de Math.random) pour éviter tout écart SSR/client
  const particles = Array.from({ length: 24 }, (_, i) => ({
    left: `${(i * 37 + 13) % 100}%`,
    size: 1.5 + ((i * 7) % 3),
    duration: 8 + ((i * 13) % 9),
    delay: (i * 1.7) % 10,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: p.left,
            bottom: -6,
            width: p.size,
            height: p.size,
            opacity: 0,
            animation: `particle-rise ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Animated nav button ────────────────────────────────── */
function NavButton({
  item, active, onClick,
}: {
  item: typeof NAV_ITEMS[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className="relative w-full overflow-hidden rounded-2xl text-left"
    >
      {/* Always-running colour sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: active
            ? "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.45) 50%, transparent 100%)"
            : "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.18) 50%, transparent 100%)",
        }}
        animate={{ x: ["-110%", "220%"] }}
        transition={{ duration: active ? 1.8 : 2.8, repeat: Infinity, ease: "linear", repeatDelay: active ? 0.2 : 0.8 }}
      />

      {/* Active background */}
      {active && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(34,211,238,0.08) 100%)" }}
        />
      )}

      {/* Left accent line */}
      {active && (
        <motion.div
          layoutId="nav-active-line"
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-accent-violet to-accent-neon"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      {/* Content */}
      <div className={`relative z-10 flex items-center gap-3.5 px-4 py-3.5 ${active ? "text-white" : "text-white/50 hover:text-white/80"} transition-colors`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
          active ? "bg-accent-violet/30 text-accent-violet" : "bg-surface-hover"
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-none mb-1 truncate">{item.label}</p>
          <p className="text-xs text-white/35 truncate">{item.desc}</p>
        </div>
        {active && (
          <ChevronRight className="w-4 h-4 text-accent-violet ml-auto" />
        )}
      </div>
    </motion.button>
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const [navView, setNavView]   = useState<NavView>("create");
  const [genType, setGenType]   = useState<GenType>("create");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* data */
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [stats,       setStats]       = useState<UserStats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [userEmail,   setUserEmail]   = useState<string | null>(null);

  /* auth / mode aperçu */
  const [isAuthed,     setIsAuthed]     = useState<boolean | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);

  /* parrainage */
  const [referral,        setReferral]        = useState<ReferralInfo | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [copiedField,     setCopiedField]     = useState<"code" | "link" | null>(null);

  /* snap rouge */
  const [snapLoading, setSnapLoading] = useState(false);

  /* generation state – create (style + image fusionnés) */
  const [styleFile,     setStyleFile]     = useState<File | null>(null);
  const [stylePreview,  setStylePreview]  = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [clothing,      setClothing]      = useState<string | null>(null);
  const [mood,          setMood]          = useState<string | null>(null);
  const [styleBg,       setStyleBg]       = useState<string | null>(null);
  const [accessory,     setAccessory]     = useState<string | null>(null);
  const [freePrompt,    setFreePrompt]    = useState("");


  /* style celebrity panel */
  const [styleExpanded, setStyleExpanded] = useState(false);

  /* generation precision options */
  const [renderStyle,   setRenderStyle]   = useState<string | null>(null);
  const [intensity,     setIntensity]     = useState<string>("moderate");
  const [preserveOutfit,setPreserveOutfit]= useState(false);

  /* debug / prompt preview */
  const [showDebug,     setShowDebug]     = useState(false);
  const [debugInfo,     setDebugInfo]     = useState<Record<string, unknown> | null>(null);
  const [loadingDebug,  setLoadingDebug]  = useState(false);

  /* generation state – swapface */
  const [swapSrcFile,     setSwapSrcFile]     = useState<File | null>(null);
  const [swapSrcPreview,  setSwapSrcPreview]  = useState<string | null>(null);
  const [swapTgtFile,     setSwapTgtFile]     = useState<File | null>(null);
  const [swapTgtPreview,  setSwapTgtPreview]  = useState<string | null>(null);
  const [faceIndex,       setFaceIndex]       = useState<"0"|"1"|"auto">("auto");
  const [swapExtraPrompt, setSwapExtraPrompt] = useState("");

  /* generation state – video */
  const [videoFile,         setVideoFile]         = useState<File | null>(null);
  const [videoPreview,      setVideoPreview]       = useState<string | null>(null);
  const [videoPrompt,       setVideoPrompt]        = useState("");
  const [videoObjectOptions,setVideoObjectOptions] = useState<Set<ObjectOption>>(new Set());
  const [videoWatchId,      setVideoWatchId]       = useState("");

  /* common */
  const [consent,       setConsent]       = useState(false);
  const [isGenerating,  setIsGenerating]  = useState(false);
  const [genProgress,   setGenProgress]   = useState(0);
  const [error,         setError]         = useState<string | null>(null);
  const [resultUrl,     setResultUrl]     = useState<string | null>(null);
  const [resultStyle,   setResultStyle]   = useState<string>("");
  // Aperçu non payant : la photo uploadée, floutée, affichée en fond PENDANT
  // toute l'animation de chargement (pour rester flou « tout le long »).
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  // Vidéo IA (Seedance) renvoie un mp4 — affiché dans <video>, pas <Image>
  const resultIsVideo = !!resultUrl && /\.(mp4|webm|mov)$/i.test(resultUrl.split("?")[0]);
  const [deletingId,       setDeletingId]       = useState<string | null>(null);
  const [deletingAll,      setDeletingAll]      = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState<{ plan: "pro" | "elite"; feature: string } | null>(null);

  const cancelRef    = useRef(false);
  const activePredRef = useRef<{ jobId?: string; predId?: string }>({});
  // Minuteur qui réinitialise l'aperçu flouté après 10 min (comptes non payants).
  const previewResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Vue initiale + retours de paiement via l'URL (?view=snaprouge, ?payment=snap_success)
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (view === "subscription") {
      // La vue Abonnement vit désormais sur /pricing
      router.push("/pricing");
    } else if (view && NAV_ITEMS.some(n => n.id === view)) {
      setNavView(view as NavView);
    }
    if (params.get("payment") === "snap_success") {
      toast.success("🔥 Paiement reçu ! Votre accès Snap Rouge s'active dans quelques secondes…", { duration: 6000 });
      setTimeout(() => fetchStats(), 4000);
    }
    // Retour de paiement abonnement/crédits : filet de sécurité indépendant du webhook.
    if (params.get("payment") === "success") {
      const sessionId = params.get("session_id");
      if (sessionId) {
        toast.loading("Validation de votre paiement…", { id: "pay-confirm" });
        fetch("/api/stripe/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
          .then((r) => r.json())
          .then(() => { toast.success("Paiement validé ! Plan activé 🎉", { id: "pay-confirm" }); return fetchStats(); })
          .catch(() => toast.error("Paiement reçu — actualisation en cours…", { id: "pay-confirm" }))
          .finally(() => {
            // Nettoie l'URL pour éviter une re-confirmation au rechargement
            window.history.replaceState({}, "", "/dashboard");
          });
      } else {
        setTimeout(() => fetchStats(), 3000);
      }
    }

    supabase.auth.getUser().then(async ({ data }) => {
      setUserEmail(data.user?.email ?? null);
      setIsAuthed(!!data.user);

      // Applique le code parrain mémorisé lors de l'inscription (?ref=CODE)
      if (data.user) {
        const refCode = localStorage.getItem("astracrea_ref");
        if (refCode) {
          localStorage.removeItem("astracrea_ref");
          try {
            const res = await fetch("/api/referral", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: refCode }),
            });
            const d = await res.json();
            if (res.ok && d.ok) {
              toast.success("🎁 Code parrain appliqué !", { duration: 6000 });
              fetchStats();
            }
          } catch { /* silent */ }
        }
      }
    });
    Promise.all([fetchGenerations(), fetchStats()]).finally(() => setLoading(false));
  }, []);

  /* Charge les infos de parrainage à l'ouverture de l'onglet */
  useEffect(() => {
    if (navView !== "referral" || !isAuthed || referral || referralLoading) return;
    setReferralLoading(true);
    fetch("/api/referral")
      .then(res => res.json().then(d => ({ ok: res.ok, d })))
      .then(({ ok, d }) => {
        if (ok && d.code) setReferral({ code: d.code, referrals: d.referrals ?? 0, credits_earned: d.credits_earned ?? 0 });
        else if (d.error) toast.error(d.error);
      })
      .catch(() => toast.error("Impossible de charger le parrainage"))
      .finally(() => setReferralLoading(false));
  }, [navView, isAuthed, referral, referralLoading]);

  const handleCopy = async (text: string, field: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(field === "code" ? "Code copié !" : "Lien copié !");
      setTimeout(() => setCopiedField(null), 2000);
    } catch { toast.error("Impossible de copier"); }
  };

  const handleSnapPurchase = async () => {
    if (!isAuthed) { setShowAuthGate(true); return; }
    setSnapLoading(true);
    try {
      const res = await fetch("/api/stripe/create-snap-rouge-session", { method: "POST" });
      const data = await res.json();
      if (res.status === 401) { setShowAuthGate(true); return; }
      if (!res.ok || !data.url) { toast.error(data.error ?? "Erreur lors du paiement"); return; }
      window.location.href = data.url;
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setSnapLoading(false);
    }
  };

  const fetchGenerations = async () => {
    try {
      const res  = await fetch("/api/generations");
      if (!res.ok) return;
      const data = await res.json();
      setGenerations(data.generations ?? []);
    } catch { /* silent */ }
  };

  const fetchStats = async () => {
    try {
      const res  = await fetch("/api/credits");
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch { /* silent */ }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/generations/${id}`, { method: "DELETE" });
      if (res.ok) { setGenerations(prev => prev.filter(g => g.id !== id)); toast.success("Supprimé"); }
    } finally { setDeletingId(null); }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const res = await fetch("/api/generations", { method: "DELETE" });
      if (res.ok) {
        setGenerations([]);
        setConfirmDeleteAll(false);
        toast.success("Historique supprimé");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setDeletingAll(false);
    }
  };

  const handleDownload = async (url: string, id: string) => {
    // Comptes gratuits : pas de téléchargement HD → renvoi vers les formules
    if (!isPaidPlan(stats?.plan)) { goToSubscription(); return; }
    try {
      const blob      = await (await fetch(url)).blob();
      const objectUrl = URL.createObjectURL(blob);
      const isVideo   = /\.(mp4|webm|mov)$/i.test(url.split("?")[0]) || blob.type.startsWith("video/");
      const a         = document.createElement("a");
      a.href = objectUrl; a.download = `astracrea-${id}.${isVideo ? "mp4" : "png"}`; a.click();
      URL.revokeObjectURL(objectUrl);
    } catch { toast.error("Erreur de téléchargement"); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };

  const toggleObjectOption = (
    options: Set<ObjectOption>,
    setOptions: (s: Set<ObjectOption>) => void,
    opt: ObjectOption,
  ) => {
    const next = new Set(options);
    if (next.has(opt)) { next.delete(opt); }
    else { if (opt === "fullGeneration") next.clear(); else next.delete("fullGeneration"); next.add(opt); }
    setOptions(next);
  };

  const handleStyleSelect = (style: Style) => {
    if (selectedStyle?.id === style.id) {
      setSelectedStyle(null);
      setClothing(null); setMood(null); setStyleBg(null); setAccessory(null);
    } else {
      setSelectedStyle(style);
    }
  };

  const handleDebugPrompt = async () => {
    if (genType !== "create") return;
    setLoadingDebug(true);
    setShowDebug(true);
    try {
      const enriched = buildEnrichedPrompt(selectedStyle, clothing, mood, styleBg, accessory);
      const res = await fetch("/api/debug-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custom_prompt:   freePrompt.trim(),
          style_prompt:    enriched,
          style_label:     selectedStyle?.label ?? "Custom",
          render_style:    renderStyle ?? "",
          intensity,
          preserve_outfit: preserveOutfit ? "1" : "0",
        }),
      });
      const data = await res.json();
      setDebugInfo(data);
    } catch {
      setDebugInfo({ error: "Impossible de charger le debug" });
    } finally {
      setLoadingDebug(false);
    }
  };

  const simulateProgress = () => {
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 12 + 4;
      if (p >= 95) { clearInterval(iv); p = 95; }
      setGenProgress(Math.min(p, 95));
    }, 500);
    return iv;
  };

  const handleCancel = async () => {
    cancelRef.current = true;
    const { jobId, predId } = activePredRef.current;
    try {
      await fetch("/api/generate/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, prediction_id: predId }),
      });
    } catch { /* silent */ }
  };

  const handleGenerate = async () => {
    // Anonyme : PAS de blocage d'inscription au clic. On le laisse générer un
    // aperçu flouté (aucun appel IA — voir le court-circuit plus bas) puis on
    // affiche le résultat flou avec un bouton « S'inscrire » par-dessus.
    setError(null);
    if (!consent) { setError("Veuillez accepter les conditions."); return; }

    const formData = new FormData();

    if (genType === "create") {
      if (!styleFile) { setError("Veuillez uploader une photo."); return; }
      if (!selectedStyle && !freePrompt.trim()) { setError("Veuillez entrer une description."); return; }
      const enriched = buildEnrichedPrompt(selectedStyle, clothing, mood, styleBg, accessory);
      formData.append("image", await resizeImageFile(styleFile));
      // Conserve l'orientation (vertical / carré / horizontal) de la photo d'entrée.
      formData.append("aspect_ratio", await getSupportedAspectRatio(styleFile));
      if (selectedStyle) {
        formData.append("style_id",    selectedStyle.id);
        formData.append("style_label", selectedStyle.label);
      }
      if (enriched)             formData.append("style_prompt",    enriched);
      if (freePrompt.trim())    formData.append("custom_prompt",   freePrompt.trim());
      if (renderStyle)          formData.append("render_style",    renderStyle);
      formData.append("intensity",       intensity);
      formData.append("preserve_outfit", preserveOutfit ? "1" : "0");
      formData.append("mode", "style");
    } else if (genType === "swapface") {
      if (!swapSrcFile) { setError("Veuillez uploader votre visage source."); return; }
      if (!swapTgtFile) { setError("Veuillez uploader la photo cible."); return; }
      formData.append("source_image", await resizeImageFile(swapSrcFile));
      formData.append("target_image", await resizeImageFile(swapTgtFile));
      formData.append("face_index",   faceIndex);
      if (swapExtraPrompt) formData.append("extra_prompt", swapExtraPrompt);
      formData.append("mode", "swapface");
    } else if (genType === "video") {
      if (!videoFile)   { setError("Veuillez uploader une vidéo."); return; }
      if (!videoPrompt) { setError("Veuillez entrer un prompt."); return; }
      if (videoFile.size > MAX_VIDEO_MB * 1024 * 1024) {
        setError(`Vidéo trop lourde : ${MAX_VIDEO_MB} Mo maximum.`); return;
      }
      try {
        const duration = await getVideoDuration(videoFile);
        if (duration > MAX_VIDEO_SECONDS + 0.5) {
          setError(`Vidéo trop longue : ${MAX_VIDEO_SECONDS} secondes maximum (la vôtre fait ${Math.round(duration)}s).`);
          return;
        }
      } catch {
        setError("Impossible de lire cette vidéo. Utilisez un MP4, MOV ou WebM valide.");
        return;
      }

      // Upload direct Supabase Storage (bypass de l'API — vidéos jusqu'à 70 Mo)
      const { data: { user: authedUser } } = await supabase.auth.getUser();
      if (!authedUser) { setShowAuthGate(true); return; }

      setIsGenerating(true);
      setGenProgress(0);
      cancelRef.current = false;
      toast("Envoi de la vidéo…", { icon: "📤" });

      const ext  = videoFile.name.split(".").pop()?.toLowerCase() ?? "mp4";
      const path = `inputs/${authedUser.id}/${Date.now().toString(36)}${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("celebswap-images")
        .upload(path, videoFile, { contentType: videoFile.type, cacheControl: "3600" });

      if (uploadError) {
        setIsGenerating(false);
        setError(`Échec de l'envoi de la vidéo : ${uploadError.message}`);
        return;
      }
      const { data: pub } = supabase.storage.from("celebswap-images").getPublicUrl(path);

      formData.append("video_url",      pub.publicUrl);
      formData.append("prompt",         videoPrompt);
      formData.append("object_options", JSON.stringify([...videoObjectOptions]));
      if (videoWatchId) formData.append("watch_id", videoWatchId);
      formData.append("mode",           "video");
    }

    // ── Comptes non payants : aperçu simulé (aucune vraie génération) ────────
    // On ne touche ni à Replicate ni aux crédits : fausse attente (~10 s pour
    // rester crédible), puis on affiche la photo uploadée — automatiquement
    // floutée + CTA abonnement (le rendu gère déjà blur + LockedOverlay quand
    // !isPaid). L'aperçu flou reste affiché 10 min tant que l'utilisateur ne
    // clique pas sur le CTA. Le rendu NET est réservé aux abonnements payants.
    const paidPlan = isPaidPlan(stats?.plan);
    const previewFile = genType === "swapface" ? swapTgtFile : styleFile;
    if (!paidPlan && genType !== "video" && previewFile) {
      const previewUrl = URL.createObjectURL(previewFile);
      // Flou affiché DÈS le début : la photo floutée sert de fond au chargement.
      setPendingPreviewUrl(previewUrl);
      setResultUrl(null);
      setResultStyle("");
      setIsGenerating(true);
      setGenProgress(0);
      cancelRef.current = false;
      const fakeIv = simulateProgress();

      // ~10 s (aléatoire 8,5–11 s) pour imiter une vraie génération
      await new Promise((r) => setTimeout(r, 8500 + Math.random() * 2500));
      clearInterval(fakeIv);

      if (cancelRef.current) {
        URL.revokeObjectURL(previewUrl);
        setPendingPreviewUrl(null);
        setIsGenerating(false);
        toast("Génération annulée", { icon: "🛑" });
        return;
      }

      // Le résultat reste la MÊME photo floutée (blur permanent via !isPaid).
      setGenProgress(100);
      setResultUrl(previewUrl);
      setResultStyle(selectedStyle?.label ?? "");
      setPendingPreviewUrl(null);
      setIsGenerating(false);

      // L'aperçu flou reste affiché 10 min. Passé ce délai, si l'utilisateur
      // n'a pas cliqué sur le CTA, on réinitialise l'aperçu.
      if (previewResetRef.current) clearTimeout(previewResetRef.current);
      previewResetRef.current = setTimeout(() => {
        URL.revokeObjectURL(previewUrl);
        setResultUrl(null);
        setResultStyle("");
      }, 10 * 60 * 1000);
      return;
    }

    setIsGenerating(true);
    setGenProgress(0);
    cancelRef.current = false;
    activePredRef.current = {};
    const iv = simulateProgress();

    try {
      // ── POST: start job (returns immediately) ──────────────────────────────
      const res = await fetch("/api/generate", { method: "POST", body: formData });
      clearInterval(iv);

      if (res.status === 402) {
        setIsGenerating(false);
        toast("Passez à un abonnement pour générer en HD", { icon: "🔒" });
        router.push("/pricing");
        return;
      }

      const rawText = await res.text();
      let startData: Record<string, unknown>;
      try { startData = JSON.parse(rawText); }
      catch { throw new Error(rawText || `Erreur serveur (${res.status})`); }
      if (!res.ok) throw new Error((startData.error as string) || `Erreur serveur (${res.status})`);

      // Non payant : le serveur renvoie un aperçu (jamais de vraie génération).
      // On affiche la photo uploadée floutée + CTA abonnement.
      if (startData.preview) {
        const previewFile = genType === "swapface" ? swapTgtFile : styleFile;
        setGenProgress(100);
        if (previewFile) setResultUrl(URL.createObjectURL(previewFile));
        setResultStyle(selectedStyle?.label ?? "");
        setIsGenerating(false);
        return;
      }

      const jobId        = startData.job_id        as string | undefined;
      const predictionId = startData.prediction_id as string | undefined;
      activePredRef.current = { jobId, predId: predictionId };

      // ── POLL until done ────────────────────────────────────────────────────
      const STEP_LABELS: Record<number, string> = {
        1: "Génération IA en cours…",
        2: "Finalisation Ultra 4K…",
      };

      let outputUrl: string | null = null;
      for (let attempt = 0; attempt < 180; attempt++) {
        await new Promise((r) => setTimeout(r, 3000));

        if (cancelRef.current) throw new Error("__CANCELED__");

        const pollUrl = jobId
          ? `/api/generate/poll?job_id=${jobId}`
          : `/api/generate/poll?prediction_id=${predictionId}`;

        const pollRes  = await fetch(pollUrl);
        const pollText = await pollRes.text();
        let poll: Record<string, unknown> = {};
        try { poll = JSON.parse(pollText); }
        catch { throw new Error(pollText || `Erreur serveur poll (${pollRes.status})`); }

        if (!pollRes.ok || poll.status === "error") {
          throw new Error((poll.error as string) || `Erreur serveur (${pollRes.status})`);
        }
        if (poll.status === "done" && poll.output_image_url) {
          outputUrl = poll.output_image_url as string;
          break;
        }

        // Update progress label based on current step
        const step = (poll.step as number) ?? 1;
        const label = STEP_LABELS[step] ?? "Génération en cours…";
        setGenProgress(Math.min(92, 15 + step * 26));
        if (attempt === 0) toast.loading(label, { id: "gen-progress" });
        else toast.loading(label, { id: "gen-progress" });
      }

      toast.dismiss("gen-progress");

      if (!outputUrl) throw new Error("Délai dépassé — réessayez");

      setGenProgress(100);
      setResultUrl(outputUrl);
      setResultStyle("");
      toast.success("Génération terminée !");
      await fetchGenerations();
      await fetchStats();

    } catch (err: unknown) {
      clearInterval(iv);
      toast.dismiss("gen-progress");
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      if (msg === "__CANCELED__") {
        toast("Génération annulée", { icon: "🛑" });
      } else {
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setIsGenerating(false);
      activePredRef.current = {};
    }
  };

  /* Compte payant ? Sinon les résultats sont floutés (aperçu). */
  const isPaid = isPaidPlan(stats?.plan);
  /* Visiteur non connecté : le CTA de l'aperçu invite à s'inscrire (pas /pricing). */
  const isAnon = isAuthed === false;

  /* Renvoie l'utilisateur vers les formules pour débloquer la HD */
  const goToSubscription = () => {
    if (previewResetRef.current) clearTimeout(previewResetRef.current);
    setResultUrl(null);
    setResultStyle("");
    router.push("/pricing");
  };

  /* Visiteur anonyme : l'aperçu flou invite à créer un compte. */
  const goToSignup = () => {
    if (previewResetRef.current) clearTimeout(previewResetRef.current);
    router.push("/register");
  };

  /* Action + libellé du CTA affiché sur l'aperçu flouté selon l'état de connexion. */
  const unlockAction = isAnon ? goToSignup : goToSubscription;
  const unlockLabel  = isAnon ? "S'inscrire" : "Débloquer en HD";

  const userInitial = userEmail?.[0]?.toUpperCase() ?? "?";

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="min-h-screen max-w-[100vw] bg-background flex overflow-hidden">

      {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
      {/* Mobile/tablette : panneau superposé (fixed) — ne pousse jamais le contenu hors écran.
          Desktop (lg+) : colonne sticky dans le flux. */}
      <div className={`shrink-0 fixed left-0 top-0 z-40 lg:sticky lg:z-auto h-screen overflow-hidden transition-[width] duration-300 ease-in-out lg:w-80 xl:w-[340px] ${sidebarOpen ? "w-60" : "w-0"}`}>
      <aside className="absolute inset-0 min-w-[240px] lg:min-w-[320px] xl:min-w-[340px] border-r border-surface-border flex flex-col bg-background/70 backdrop-blur-xl">

        {/* Logo */}
        <Link href="/" className="px-5 py-4 border-b border-surface-border flex items-center gap-2 hover:bg-surface-hover transition-colors">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo2.png" alt="AstraCrea" className="h-11 w-auto rounded-xl" />
          <span className="font-black text-lg tracking-tight">Astra<span className="gradient-text">Crea</span></span>
        </Link>

        {/* User info — mode aperçu si non connecté */}
        {isAuthed === false ? (
          <div className="px-4 py-4 border-b border-surface-border space-y-2.5">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-hover border border-accent-violet/20">
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-white/40 font-black text-base flex-shrink-0 border border-surface-border">
                ?
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">Mode aperçu</p>
                <p className="text-white/35 text-xs truncate">Non connecté</p>
              </div>
            </div>
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl btn-primary text-sm font-bold"
            >
              <LogIn className="w-4 h-4" />
              Se connecter
            </Link>
            <Link
              href="/register"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-accent-violet/40 text-accent-violet hover:bg-accent-violet/10 transition-all text-sm font-bold"
            >
              <UserPlus className="w-4 h-4" />
              Créer un compte gratuit
            </Link>
          </div>
        ) : (
        <div className="px-4 py-4 border-b border-surface-border">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-hover">
            <div className="w-10 h-10 rounded-xl bg-gradient-violet-neon flex items-center justify-center text-white font-black text-base flex-shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{userEmail?.split("@")[0] ?? "—"}</p>
              <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
                {isPaid ? (
                  <>
                    <Crown className="w-3 h-3 text-accent-violet flex-shrink-0" />
                    <span className="text-accent-violet text-xs font-bold truncate">Abonnement actif</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-white/40 flex-shrink-0" />
                    <span className="text-white/40 text-xs font-bold truncate">Aperçu gratuit</span>
                  </>
                )}
              </div>
            </div>
            {/* Plan badge */}
            {stats?.plan && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border flex-shrink-0 ${
                userPlanTier(stats.plan) === "elite" ? "text-amber-400 border-amber-400/40 bg-amber-400/10" :
                userPlanTier(stats.plan) === "pro"   ? "text-accent-violet border-accent-violet/40 bg-accent-violet/10" :
                "text-white/40 border-surface-border bg-surface"
              }`}>
                {userPlanTier(stats.plan) === "elite" ? "ELITE" : userPlanTier(stats.plan) === "pro" ? "PRO" : isPaid ? "ESSEN." : "GRATUIT"}
              </span>
            )}
          </div>
        </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          <p className="text-white/25 text-xs font-semibold uppercase tracking-widest px-3 mb-3">Menu</p>
          {NAV_ITEMS.map(item => (
            <NavButton
              key={item.id}
              item={item}
              active={navView === item.id}
              onClick={() => {
                // Abonnement → page /pricing (pas de vue interne)
                if (item.id === "subscription") { router.push("/pricing"); return; }
                setNavView(item.id); setSidebarOpen(false);
              }}
            />
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-surface-border space-y-3">
          {/* Statut d'abonnement */}
          {isAuthed !== false && (() => {
            const tier = userPlanTier(stats?.plan);
            if (isPaid) {
              const isElite = tier === "elite";
              const label   = isElite ? "Elite" : tier === "pro" ? "Pro" : "Essentiel";
              return (
                <div className="px-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">Formule</span>
                    <span className={`font-bold ${isElite ? "text-amber-400" : "text-accent-violet"}`}>
                      {label} · générations illimitées
                    </span>
                  </div>
                </div>
              );
            }
            return (
              <Link href="/pricing" className="block px-3 py-2.5 rounded-xl bg-accent-violet/10 border border-accent-violet/30 text-center">
                <p className="text-xs text-white/70 leading-relaxed">
                  Compte gratuit — <span className="text-accent-violet font-bold">aperçu flouté</span>
                </p>
                <p className="text-[11px] text-accent-violet font-semibold mt-0.5">Débloquer la HD →</p>
              </Link>
            );
          })()}

          {userEmail === "gnemmialex@gmail.com" && (
            <Link
              href="/admin"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-accent-violet border border-accent-violet/30 hover:bg-accent-violet/10 transition-all text-sm font-semibold"
            >
              <Settings className="w-4 h-4" />
              Espace Admin
            </Link>
          )}

          {isAuthed === false ? (
            <p className="text-white/30 text-xs text-center leading-relaxed px-1">
              🔒 Mode aperçu — connectez-vous pour générer vos images
            </p>
          ) : (
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white/40 hover:text-red-400 border border-surface-border hover:border-red-500/30 transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </motion.button>
          )}
        </div>

      </aside>
      </div>

      {/* Bouton flèche — mobile/tablette uniquement (fixed, suit le bord droit du sidebar) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-1/2 -translate-y-1/2 lg:hidden z-50 w-6 h-14 rounded-r-2xl bg-background/95 border border-surface-border flex items-center justify-center text-white/60 hover:text-white shadow-lg"
        style={{ left: sidebarOpen ? "240px" : "0px", transition: "left 300ms ease-in-out" }}
        aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <main className="flex-1 min-w-0 max-w-full flex flex-col overflow-hidden relative"
        style={{ backgroundImage: "url('/paysage.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Overlay sombre pour la lisibilité */}
        <div className="absolute inset-0 bg-background/55 backdrop-blur-[2px] pointer-events-none z-0" />

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto relative z-10">
          <div className="px-6 lg:px-8">

            {/* ── Bannière mode aperçu (non connecté) ── */}
            {isAuthed === false && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-accent-violet/10 border border-accent-violet/30 rounded-2xl px-5 py-4 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <Lock className="w-5 h-5 text-accent-violet flex-shrink-0 hidden sm:block" />
                  <div>
                    <p className="font-bold text-sm text-white">Vous explorez le Dashboard en mode aperçu</p>
                    <p className="text-white/50 text-xs mt-0.5">Connectez-vous ou créez un compte gratuit pour générer un aperçu — le rendu net en HD est réservé aux abonnements</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href="/login" className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-accent-violet/40 text-accent-violet hover:bg-accent-violet/10 text-sm font-bold transition-all whitespace-nowrap">
                    <LogIn className="w-4 h-4" />
                    Connexion
                  </Link>
                  <Link href="/register" className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm whitespace-nowrap">
                    <UserPlus className="w-4 h-4" />
                    Créer un compte
                  </Link>
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">

              {/* ══ CREATE VIEW ══ */}
              {navView === "create" && (
                <motion.div key={`create-${genType}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>

                  {/* ── Gen type tabs — centred, avec espace au-dessus ── */}
                  <div className="pt-10 pb-6 flex justify-center">
                    <div className="flex gap-2 p-1 bg-surface/60 backdrop-blur-xl border border-surface-border rounded-2xl">
                      {GEN_TABS.map(tab => {
                        const Icon    = tab.icon;
                        const active  = genType === tab.id;
                        const tier    = userPlanTier(stats?.plan);
                        // SwapFace : Pro ou Ultra. Vidéo IA : Ultra uniquement.
                        const isSwapLocked  = tab.id === "swapface" && tier !== "pro" && tier !== "elite";
                        const isVideoLocked = tab.id === "video"    && tier !== "elite";
                        const isLocked      = isSwapLocked || isVideoLocked;
                        const lockBadge     = tab.id === "video" ? "Ultra" : "Pro";
                        return (
                          <motion.button
                            key={tab.id}
                            onClick={() => {
                              if (isVideoLocked) {
                                toast("La Vidéo IA est réservée au plan Ultra 🔒", { icon: "🔒" });
                                return;
                              }
                              if (isSwapLocked) {
                                toast("Le SwapFace est disponible à partir du plan Pro 🔒", { icon: "🔒" });
                                return;
                              }
                              setGenType(tab.id); setError(null);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all overflow-hidden ${
                              isLocked
                                ? "text-white/25 cursor-not-allowed"
                                : active
                                ? "bg-accent-violet text-white shadow-violet"
                                : "text-white/45 hover:text-white"
                            }`}
                          >
                            {active && !isLocked && (
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                animate={{ x: ["-120%", "220%"] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
                              />
                            )}
                            {isLocked ? (
                              <Lock className="w-3.5 h-3.5 relative z-10 flex-shrink-0" />
                            ) : (
                              <Icon className="w-3.5 h-3.5 relative z-10 flex-shrink-0" />
                            )}
                            <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                            {isLocked && (
                              <span className="relative z-10 hidden sm:inline text-[9px] font-bold text-accent-violet/70 bg-accent-violet/10 border border-accent-violet/20 px-1 rounded ml-0.5">{lockBadge}</span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Forms — compacts, centrés, glass ── */}
                  <div className="max-w-4xl mx-auto pb-10 px-2">
                  <div className="grid grid-cols-1 gap-6">
                  {/* ── LEFT: forms — full width on desktop ── */}
                  <div className="space-y-4">

                  {/* ── CRÉER (Style IA + Image IA fusionnés) ── */}
                  {genType === "create" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Col gauche — upload */}
                      <div className="lg:col-span-1">
                        <div className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl p-4">
                          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <StepBadge n={1} />Votre photo
                          </h2>
                          <UploadBox
                            onFileSelected={(f,p)=>{setStyleFile(f);setStylePreview(p);setError(null);}}
                            onClear={()=>{setStyleFile(null);setStylePreview(null);}}
                            preview={stylePreview}
                            label="Photo de visage"
                          />
                          <p className="text-white/30 text-xs mt-2">💡 Visage bien visible.</p>
                        </div>
                      </div>

                      {/* Col droite — style + options + prompt + generate */}
                      <div className="lg:col-span-2 space-y-4">


                        {/* Description libre + Options — côte à côte sur desktop */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {/* Description libre */}
                        <div className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl p-3">
                          <h2 className="font-semibold text-sm mb-1.5 flex items-center gap-2">
                            <StepBadge n={2} />
                            Description
                            <span className="text-red-400/50 text-[10px] font-normal">(requis)</span>
                          </h2>
                          <textarea
                            value={freePrompt}
                            onChange={e => setFreePrompt(e.target.value)}
                            placeholder="Décrivez la transformation : tenue, ambiance, fond…"
                            rows={2}
                            className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-accent-violet/60 resize-none"
                          />
                        </div>

                        {/* Options de génération */}
                        <div className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl p-4 space-y-3">
                          <h2 className="font-semibold text-sm flex items-center gap-2">
                            <StepBadge n={3} />
                            Options de génération
                            <span className="text-white/30 text-[10px] font-normal">(optionnel)</span>
                          </h2>

                          {/* Intensité */}
                          <GenOptionChips
                            title="Intensité de transformation"
                            options={INTENSITY_OPTIONS}
                            selected={intensity}
                            onSelect={setIntensity}
                            planTier={userPlanTier(stats?.plan)}
                            onLocked={(rp, f) => setUpgradeTarget({ plan: rp, feature: f })}
                          />

                          {/* Conserver la tenue */}
                          {(() => {
                            const outfitLocked = userPlanTier(stats?.plan) === "essentiel";
                            return (
                              <label
                                className={`flex items-center gap-2.5 cursor-pointer group ${outfitLocked ? "opacity-50" : ""}`}
                                onClick={outfitLocked ? (e) => { e.preventDefault(); setUpgradeTarget({ plan: "pro", feature: "Conserver la tenue" }); } : undefined}
                              >
                                <div className="relative flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={preserveOutfit && !outfitLocked}
                                    onChange={e => !outfitLocked && setPreserveOutfit(e.target.checked)}
                                    className="sr-only"
                                    readOnly={outfitLocked}
                                  />
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${preserveOutfit && !outfitLocked ? "bg-accent-violet border-accent-violet" : "border-surface-border group-hover:border-accent-violet/50"}`}>
                                    {preserveOutfit && !outfitLocked && <span className="text-white text-[9px] font-bold">✓</span>}
                                  </div>
                                </div>
                                <span className={`text-white/60 text-xs flex items-center gap-1 ${outfitLocked ? "line-through" : ""}`}>
                                  {outfitLocked && <Lock className="w-2.5 h-2.5 flex-shrink-0" />}
                                  Conserver la tenue actuelle (ne pas changer les vêtements)
                                  {outfitLocked && <span className="text-[8px] font-bold text-accent-violet/70 ml-1 no-underline not-italic" style={{textDecoration:"none"}}>Pro</span>}
                                </span>
                              </label>
                            );
                          })()}
                        </div>
                        </div>{/* end grid description+options */}

                        <GenerateCard
                          consent={consent}
                          setConsent={setConsent}
                          error={error}
                          onGenerate={handleGenerate}
                          onCancel={handleCancel}
                          isGenerating={isGenerating}
                          canGenerate={!!(styleFile && freePrompt.trim() && consent)}
                          step={4}
                          plan={stats?.plan}
                        />

                        {/* Bouton debug — voir le prompt exact */}
                        {genType === "create" && (
                          <div>
                            <button
                              onClick={handleDebugPrompt}
                              disabled={loadingDebug}
                              className="w-full py-2 rounded-xl border border-surface-border text-white/35 hover:text-white/60 hover:border-accent-violet/30 text-xs transition-all flex items-center justify-center gap-2"
                            >
                              🔍 {loadingDebug ? "Chargement…" : "Voir le prompt exact envoyé à l'IA"}
                            </button>

                            <AnimatePresence>
                              {showDebug && debugInfo && (
                                <motion.div
                                  initial={{ opacity: 0, y: -6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -6 }}
                                  className="bg-surface border border-surface-border rounded-2xl p-4 space-y-3 text-xs mt-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="font-bold text-white/80">Diagnostic — prompt envoyé à Z-Image Turbo</p>
                                    <button onClick={() => setShowDebug(false)} className="text-white/30 hover:text-white">✕</button>
                                  </div>

                                  {(debugInfo as { debug?: Record<string,unknown> }).debug && (
                                    <div className="grid grid-cols-2 gap-2">
                                      {Object.entries((debugInfo as { debug: Record<string,unknown> }).debug).map(([k, v]) => (
                                        <div key={k} className="bg-surface-hover rounded-lg p-2">
                                          <p className="text-white/35 text-[10px] uppercase tracking-wider">{k.replace(/_/g, " ")}</p>
                                          <p className="text-white/80 font-medium break-all">{String(v)}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="bg-surface-hover rounded-xl p-3">
                                    <p className="text-white/35 text-[10px] uppercase tracking-wider mb-2">Prompt complet → Z-Image Turbo</p>
                                    <p className="text-white/70 leading-relaxed whitespace-pre-wrap">
                                      {String((debugInfo as { instruction_sent_to_flux?: string; prompt?: string }).prompt ?? (debugInfo as { instruction_sent_to_flux?: string }).instruction_sent_to_flux ?? "")}
                                    </p>
                                  </div>

                                  <p className="text-amber-400/70 text-[10px]">
                                    ⚠️ Si l&apos;image source n&apos;est pas accessible (bucket privé), le modèle ignorera complètement votre photo.
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── VIDEO IA ── */}
                  {genType === "video" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 space-y-4">
                        <div className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl p-4">
                          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><StepBadge n={1} />Votre vidéo</h2>
                          <VideoUploadBox onFileSelected={(f,p)=>{setVideoFile(f);setVideoPreview(p);}} onClear={()=>{setVideoFile(null);setVideoPreview(null);}} preview={videoPreview} label="Vidéo à transformer" />
                        </div>
                        <div className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl p-4">
                          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><StepBadge n={2} />Prompt</h2>
                          <textarea value={videoPrompt} onChange={e=>setVideoPrompt(e.target.value)}
                            placeholder="Décrivez la transformation souhaitée…" rows={3}
                            className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-accent-violet/60 resize-none" />
                        </div>
                        <div className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl p-4">
                          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><StepBadge n={3} />Modèle de montre <span className="text-white/30 text-xs font-normal">(optionnel)</span></h2>
                          <select
                            value={videoWatchId}
                            onChange={e => setVideoWatchId(e.target.value)}
                            className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent-violet/60"
                          >
                            <option value="">Aucune montre</option>
                            {WATCH_BRANDS.map(brand => (
                              <optgroup key={brand} label={brand}>
                                {WATCH_OPTIONS.filter(w => w.brand === brand).map(w => (
                                  <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          <p className="text-white/30 text-xs mt-2">💡 L&apos;IA utilise les vraies photos de référence de la montre pour un rendu fidèle.</p>
                        </div>
                        <div className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl p-4">
                          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><StepBadge n={4} />Modifier un objet <span className="text-white/30 text-xs font-normal">(optionnel)</span></h2>
                          <div className="space-y-2">
                            {([
                              {id:"addObject" as ObjectOption, icon:PlusCircle, label:"Ajouter un objet", desc:"Insère dans la vidéo"},
                              {id:"replaceObject" as ObjectOption, icon:Replace, label:"Remplacer un objet", desc:"Frame par frame"},
                            ]).map(({id,icon:Icon,label,desc})=>{
                              const checked = videoObjectOptions.has(id);
                              return (
                                <button key={id} onClick={()=>toggleObjectOption(videoObjectOptions,setVideoObjectOptions,id)}
                                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${checked?"bg-accent-violet/15 border-accent-violet":"border-surface-border hover:border-accent-violet/40 hover:bg-surface-hover"}`}>
                                  <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${checked?"bg-accent-violet border-accent-violet":"border-surface-border"}`}>
                                    {checked&&<span className="text-white text-[10px]">✓</span>}
                                  </div>
                                  <Icon className={`w-4 h-4 flex-shrink-0 ${checked?"text-accent-violet":"text-white/40"}`} />
                                  <div>
                                    <p className={`text-xs font-semibold ${checked?"text-white":"text-white/70"}`}>{label}</p>
                                    <p className="text-white/35 text-xs">{desc}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="lg:col-span-1">
                        <GenerateCard consent={consent} setConsent={setConsent} error={error} onGenerate={handleGenerate} onCancel={handleCancel} isGenerating={isGenerating} canGenerate={!!(videoFile && videoPrompt && consent)} step={5} plan={stats?.plan} />
                      </div>
                    </div>
                  )}

                  </div>{/* end forms col */}

                  {/* ── RIGHT: result panel — visible sur mobile/tablette, remplacé par overlay sur desktop ── */}
                  <div className="xl:hidden">
                    <div className="sticky top-6 max-h-[calc(100vh-3.5rem)] overflow-y-auto rounded-2xl">
                      <div className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
                          <h3 className="font-semibold text-sm">Résultat</h3>
                          {resultUrl && (
                            <button
                              onClick={() => { setResultUrl(null); setResultStyle(""); }}
                              className="text-xs text-white/40 hover:text-white transition-colors"
                            >
                              Effacer
                            </button>
                          )}
                        </div>
                        {resultUrl ? (
                          <div>
                            <div className="relative aspect-square bg-surface-hover overflow-hidden">
                              {resultIsVideo ? (
                                <video src={resultUrl} controls autoPlay loop playsInline className={`absolute inset-0 w-full h-full object-contain ${isPaid ? "" : "blur-[48px] scale-125"}`} />
                              ) : (
                                <Image src={resultUrl} alt={resultStyle} fill className={`object-contain ${isPaid ? "" : "blur-[48px] scale-125"}`} />
                              )}
                              {!isPaid && <BlurVeil strong />}
                              {!isPaid && <LockedOverlay onUnlock={unlockAction} signup={isAnon} />}
                            </div>
                            <div className="p-4 space-y-3">
                              <p className="text-white/50 text-xs text-center">{resultStyle}</p>
                              {isPaid ? (
                                <button
                                  onClick={() => handleDownload(resultUrl, Date.now().toString())}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent-violet hover:bg-accent-violet/80 text-white text-sm font-semibold transition-all"
                                >
                                  <Download className="w-4 h-4" />
                                  Télécharger
                                </button>
                              ) : (
                                <button
                                  onClick={unlockAction}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent-violet hover:bg-accent-violet/80 text-white text-sm font-semibold transition-all"
                                >
                                  {isAnon ? <UserPlus className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                                  {unlockLabel}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="relative aspect-square flex flex-col items-center justify-center gap-3 text-center p-6">
                            {/* Photo floutée en fond pendant tout le chargement (aperçu non payant) */}
                            {isGenerating && !isPaid && pendingPreviewUrl && (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={pendingPreviewUrl} alt="" className="absolute inset-0 w-full h-full object-cover blur-[48px] scale-125 pointer-events-none" />
                                <BlurVeil strong />
                                <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                              </>
                            )}
                            {isGenerating ? (
                              <div className="relative z-10 flex flex-col items-center gap-3 w-full">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                  className="w-12 h-12 rounded-full border-2 border-accent-violet/30 border-t-accent-violet"
                                />
                                <p className={`text-sm font-medium ${!isPaid && pendingPreviewUrl ? "text-white/80" : "text-white/50"}`}>Génération en cours…</p>
                                <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full bg-gradient-violet-neon rounded-full"
                                    animate={{ width: `${genProgress}%` }}
                                    transition={{ ease: "easeOut", duration: 0.4 }}
                                  />
                                </div>
                                <p className="text-accent-violet text-xs font-bold">{Math.round(genProgress)}%</p>
                                <motion.button
                                  onClick={handleCancel}
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.96 }}
                                  className="mt-1 flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-all"
                                >
                                  <StopCircle className="w-3.5 h-3.5" />
                                  Arrêter
                                </motion.button>
                              </div>
                            ) : (
                              <>
                                <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center">
                                  <Sparkles className="w-7 h-7 text-white/20" />
                                </div>
                                <p className="text-white/40 text-sm">Votre résultat apparaîtra ici</p>
                                <p className="text-white/20 text-xs">Remplissez le formulaire et appuyez sur Générer</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  </div>{/* end grid */}
                  </div>{/* end max-w-7xl */}

                  {/* ── Overlay desktop (xl+) : affiché pendant la génération OU quand résultat prêt ── */}
                  <AnimatePresence>
                    {(isGenerating || resultUrl) && (
                      <motion.div
                        key="desktop-result-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="hidden xl:flex fixed inset-0 z-[200] items-center justify-center p-10"
                      >
                        {/* Backdrop — clic ferme si résultat affiché */}
                        <div
                          className="absolute inset-0 bg-black/82 backdrop-blur-sm"
                          onClick={resultUrl && !isGenerating ? () => { setResultUrl(null); setResultStyle(""); } : undefined}
                        />

                        {/* Carte résultat */}
                        <motion.div
                          initial={{ scale: 0.9, y: 28 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.9, y: 28 }}
                          transition={{ type: "spring", stiffness: 280, damping: 26 }}
                          className="relative z-10 w-full max-w-2xl bg-surface border border-surface-border rounded-3xl overflow-hidden shadow-2xl"
                        >
                          {/* Header */}
                          <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
                            <h3 className="font-bold text-xl">
                              {isGenerating ? "Génération en cours…" : "Résultat"}
                            </h3>
                            {resultUrl && !isGenerating && (
                              <button
                                onClick={() => { setResultUrl(null); setResultStyle(""); }}
                                className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-white/40 hover:text-white transition-colors"
                              >✕</button>
                            )}
                          </div>

                          {/* Corps — résultat */}
                          {resultUrl && !isGenerating ? (
                            <div>
                              <div className="relative bg-surface-hover overflow-hidden" style={{ height: "60vh" }}>
                                {resultIsVideo ? (
                                  <video src={resultUrl} controls autoPlay loop playsInline className={`absolute inset-0 w-full h-full object-contain ${isPaid ? "" : "blur-[48px] scale-125"}`} />
                                ) : (
                                  <Image src={resultUrl} alt={resultStyle || "Résultat"} fill className={`object-contain ${isPaid ? "" : "blur-[48px] scale-125"}`} />
                                )}
                                {!isPaid && <BlurVeil strong />}
                                {!isPaid && <LockedOverlay onUnlock={unlockAction} signup={isAnon} />}
                              </div>
                              <div className="p-6 flex items-center gap-4">
                                <p className="text-white/50 text-sm flex-1 truncate">
                                  {isPaid ? resultStyle : isAnon ? "Aperçu flouté — inscrivez-vous pour continuer" : "Aperçu flouté — débloquez la HD avec une formule"}
                                </p>
                                {isPaid ? (
                                  <button
                                    onClick={() => handleDownload(resultUrl, Date.now().toString())}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-violet hover:bg-accent-violet/80 text-white font-semibold transition-all text-sm whitespace-nowrap"
                                  >
                                    <Download className="w-4 h-4" />Télécharger
                                  </button>
                                ) : (
                                  <button
                                    onClick={unlockAction}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-violet hover:bg-accent-violet/80 text-white font-semibold transition-all text-sm whitespace-nowrap"
                                  >
                                    {isAnon ? <UserPlus className="w-4 h-4" /> : <Crown className="w-4 h-4" />}{unlockLabel}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* Corps — chargement */
                            <div className="relative flex flex-col items-center justify-center gap-6 py-16 px-8 overflow-hidden">
                              {/* Photo floutée en fond pendant tout le chargement (aperçu non payant) */}
                              {!isPaid && pendingPreviewUrl && (
                                <>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={pendingPreviewUrl} alt="" className="absolute inset-0 w-full h-full object-cover blur-[48px] scale-125 pointer-events-none" />
                                  <BlurVeil strong />
                                  <div className="absolute inset-0 bg-black/45 pointer-events-none" />
                                </>
                              )}
                              <div className="relative z-10 w-24 h-24">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                  className="absolute inset-0 rounded-full border-4 border-accent-violet/20 border-t-accent-violet"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Sparkles className="w-8 h-8 text-accent-violet/60" />
                                </div>
                              </div>
                              <div className="relative z-10 text-center space-y-1.5">
                                <p className="text-white/85 text-2xl font-black">Génération IA</p>
                                <p className={`text-sm ${!isPaid && pendingPreviewUrl ? "text-white/60" : "text-white/40"}`}>Votre image est en cours de création…</p>
                              </div>
                              <div className="relative z-10 w-80 space-y-2">
                                <div className="h-2.5 bg-surface-hover rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full bg-gradient-violet-neon rounded-full"
                                    animate={{ width: `${genProgress}%` }}
                                    transition={{ ease: "easeOut", duration: 0.4 }}
                                  />
                                </div>
                                <p className="text-center text-accent-violet font-bold text-xl">{Math.round(genProgress)}%</p>
                              </div>
                              <motion.button
                                onClick={handleCancel}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="relative z-10 flex items-center gap-2 px-6 py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 font-semibold transition-all"
                              >
                                <StopCircle className="w-4 h-4" />
                                Arrêter la génération
                              </motion.button>
                            </div>
                          )}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ══ HISTORY VIEW ══ */}
              {navView === "history" && (
                <motion.div key="history" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                  <div className="mb-7 pt-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-black mb-1">Historique</h1>
                        <p className="text-white/40">{generations.length} création{generations.length!==1?"s":""}</p>
                      </div>
                      {generations.length > 0 && !confirmDeleteAll && (
                        <button
                          onClick={() => setConfirmDeleteAll(true)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500 text-red-400 hover:bg-red-500/30 hover:text-white text-xs font-semibold transition-all mt-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Tout supprimer
                        </button>
                      )}
                      {confirmDeleteAll && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                          <p className="text-red-400 text-xs font-medium">Supprimer les {generations.length} images ?</p>
                          <button
                            onClick={handleDeleteAll}
                            disabled={deletingAll}
                            className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all disabled:opacity-50"
                          >
                            {deletingAll ? "…" : "Confirmer"}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteAll(false)}
                            className="px-2.5 py-1 rounded-lg border border-surface-border text-white/50 hover:text-white text-xs transition-all"
                          >
                            Annuler
                          </button>
                        </div>
                      )}
                    </div>
                    {/* ── Rétention 48h — bien visible ── */}
                    <div className="mt-3 flex items-center gap-3 bg-amber-400/10 border border-amber-400/40 rounded-xl px-4 py-3">
                      <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <p className="text-white/60 text-xs leading-relaxed">
                        <strong className="text-amber-400">Conservation limitée à 48h</strong> — chaque image est{" "}
                        <strong className="text-white">automatiquement supprimée 48 heures</strong> après sa création.
                        Pensez à <strong className="text-white">télécharger vos créations</strong> pour les garder !
                      </p>
                    </div>
                  </div>
                  {generations.length === 0 ? (
                    <div className="text-center py-24 card">
                      <Sparkles className="w-10 h-10 text-white/20 mx-auto mb-4" />
                      <p className="text-white/50 font-semibold mb-2">Aucune création</p>
                      <p className="text-white/30 text-sm mb-5">Lance ta première génération</p>
                      <button onClick={()=>setNavView("create")} className="btn-primary inline-flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />Créer maintenant
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {generations.map((gen,i)=>(
                        <motion.div key={gen.id} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:i*0.04}}
                          className="group relative rounded-xl overflow-hidden border border-surface-border hover:border-accent-violet/40 transition-all">
                          <div className="aspect-square relative overflow-hidden">
                            {/\.(mp4|webm|mov)$/i.test(gen.output_image_url.split("?")[0]) ? (
                              <video src={gen.output_image_url} muted loop playsInline autoPlay className={`absolute inset-0 w-full h-full object-cover ${isPaid ? "" : "blur-xl scale-110"}`} />
                            ) : (
                              <Image src={gen.output_image_url} alt={gen.style} fill className={`object-cover ${isPaid ? "" : "blur-xl scale-110"}`} />
                            )}
                            {!isPaid && <BlurVeil />}
                            {!isPaid && <LockedOverlay onUnlock={unlockAction} signup={isAnon} compact />}
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 gap-2 z-30">
                            {isPaid && (
                              <Link href={`/result?id=${gen.id}`} className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20">
                                <Sparkles className="w-3.5 h-3.5" />
                              </Link>
                            )}
                            <button onClick={()=>handleDownload(gen.output_image_url,gen.id)} className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20">
                              {isPaid ? <Download className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={()=>handleDelete(gen.id)} disabled={deletingId===gen.id} className="w-8 h-8 bg-red-500/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-red-500 hover:bg-red-500 transition-colors disabled:opacity-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                            <p className="text-white text-xs font-medium truncate">{gen.style}</p>
                            <p className="text-white/50 text-xs">{new Date(gen.created_at).toLocaleDateString("fr-FR")}</p>
                          </div>
                          {/* Compte à rebours avant suppression (rétention 48h) */}
                          {(() => {
                            const hoursLeft = Math.max(0, Math.ceil(48 - (Date.now() - new Date(gen.created_at).getTime()) / 3_600_000));
                            return (
                              <span className={`absolute top-1.5 right-1.5 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-sm border ${
                                hoursLeft <= 8 ? "bg-red-500/30 border-red-500/50 text-red-300" : "bg-black/50 border-white/15 text-white/70"
                              }`}>
                                <Clock className="w-2.5 h-2.5" />
                                {hoursLeft}h
                              </span>
                            );
                          })()}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ══ REFERRAL VIEW ══ */}
              {navView === "referral" && (
                <motion.div key="referral" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                  <div className="mb-7 pt-8">
                    <h1 className="text-3xl font-black mb-1 flex items-center gap-3">
                      <Gift className="w-7 h-7 text-accent-violet" />
                      Parrainage
                    </h1>
                    <p className="text-white/40">Invitez vos amis à découvrir AstraCrea</p>
                  </div>

                  <div className="max-w-3xl space-y-5">

                    {/* Comment ça marche */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="card border-accent-violet/25 bg-accent-violet/5">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-accent-violet/15 flex items-center justify-center text-accent-violet">
                            <Users className="w-5 h-5" />
                          </div>
                          <p className="text-lg font-black text-accent-violet">Partagez</p>
                        </div>
                        <p className="font-bold text-white text-sm mb-1">Votre lien unique</p>
                        <p className="text-white/45 text-xs leading-relaxed">Envoyez votre lien de parrainage à vos amis pour leur faire découvrir AstraCrea.</p>
                      </div>
                      <div className="card border-green-500/25 bg-green-500/5">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-green-400">
                            <Gift className="w-5 h-5" />
                          </div>
                          <p className="text-lg font-black text-green-400">Bientôt</p>
                        </div>
                        <p className="font-bold text-white text-sm mb-1">Des avantages à venir</p>
                        <p className="text-white/45 text-xs leading-relaxed">Un programme de récompenses parrainage arrive prochainement pour les comptes les plus actifs.</p>
                      </div>
                    </div>

                    {isAuthed === false ? (
                      /* Invité — incite à se connecter */
                      <div className="card text-center py-12">
                        <Lock className="w-10 h-10 text-white/20 mx-auto mb-4" />
                        <p className="font-bold text-white mb-2">Connectez-vous pour obtenir votre code parrain</p>
                        <p className="text-white/40 text-sm mb-6">Chaque compte dispose d&apos;un code personnalisé unique à partager</p>
                        <div className="flex items-center justify-center gap-3">
                          <Link href="/login" className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-accent-violet/40 text-accent-violet hover:bg-accent-violet/10 text-sm font-bold transition-all">
                            <LogIn className="w-4 h-4" />Se connecter
                          </Link>
                          <Link href="/register" className="btn-primary flex items-center gap-1.5 px-5 py-2.5 text-sm">
                            <UserPlus className="w-4 h-4" />Créer un compte
                          </Link>
                        </div>
                      </div>
                    ) : referralLoading || !referral ? (
                      <div className="card flex items-center justify-center py-16">
                        <Loader2 className="w-7 h-7 text-accent-violet animate-spin" />
                      </div>
                    ) : (
                      <>
                        {/* Code + lien */}
                        <div className="card space-y-4">
                          <h2 className="font-bold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-accent-violet" />
                            Votre code personnalisé
                          </h2>

                          {/* Code */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-surface-hover border border-accent-violet/30 rounded-xl px-4 py-3 font-mono font-black text-xl tracking-[0.25em] text-accent-violet text-center select-all">
                              {referral.code}
                            </div>
                            <button
                              onClick={() => handleCopy(referral.code, "code")}
                              className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-surface-border text-white/60 hover:text-white hover:border-accent-violet/40 text-sm font-semibold transition-all flex-shrink-0"
                            >
                              {copiedField === "code" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                              {copiedField === "code" ? "Copié" : "Copier"}
                            </button>
                          </div>

                          {/* Lien de partage */}
                          <div>
                            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Votre lien de parrainage</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-surface-hover border border-surface-border rounded-xl px-4 py-3 text-white/70 text-sm truncate select-all">
                                {`${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${referral.code}`}
                              </div>
                              <button
                                onClick={() => handleCopy(`${window.location.origin}/register?ref=${referral.code}`, "link")}
                                className="btn-primary flex items-center gap-1.5 px-4 py-3 text-sm flex-shrink-0"
                              >
                                {copiedField === "link" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedField === "link" ? "Copié !" : "Copier le lien"}
                              </button>
                            </div>
                            <p className="text-white/30 text-xs mt-2">
                              💡 Partagez ce lien : chaque ami qui crée son compte avec est comptabilisé dans vos filleuls.
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="card text-center">
                            <p className="text-3xl font-black gradient-text">{referral.referrals}</p>
                            <p className="text-white/40 text-sm mt-1">Filleul{referral.referrals !== 1 ? "s" : ""} inscrit{referral.referrals !== 1 ? "s" : ""}</p>
                          </div>
                          <div className="card text-center flex flex-col items-center justify-center">
                            <Gift className="w-7 h-7 text-green-400 mb-1" />
                            <p className="text-white/40 text-sm">Avantages bientôt disponibles</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ══ SNAP ROUGE VIEW ══ */}
              {navView === "snaprouge" && (
                <motion.div key="snaprouge" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                  <div className="mb-7 pt-8">
                    <h1 className="text-3xl font-black mb-1 flex items-center gap-3">
                      <Flame className="w-7 h-7 text-red-500" />
                      Snap Rouge
                    </h1>
                    <p className="text-white/40">La technique secrète pour envoyer vos créations en vrai Snap</p>
                  </div>

                  <div className="max-w-3xl space-y-5">

                    {/* Présentation */}
                    <div className="card border-red-500/25 relative overflow-hidden">
                      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
                      <div className="relative">
                        <h2 className="text-xl font-black mb-3">
                          Envoyez vos photos IA comme de <span className="text-red-500">vrais Snaps</span> 🔥
                        </h2>
                        <p className="text-white/55 text-sm leading-relaxed mb-4">
                          Sur Snapchat, une photo envoyée depuis la galerie apparaît en <strong className="text-white/80">Snap violet</strong> —
                          tout le monde voit que ce n&apos;est pas une photo prise sur le moment. Avec la technique Snap Rouge,
                          vos transformations AstraCrea partent en <strong className="text-red-400">Snap Rouge</strong>,
                          exactement comme une photo prise en direct avec l&apos;appareil photo. Effet garanti auprès de vos amis.
                        </p>
                        <ul className="space-y-2 mb-2">
                          {[
                            "Guide vidéo complet, étape par étape",
                            "Fonctionne sur iPhone et Android",
                            "Accès à vie — payez une seule fois",
                            "Mises à jour de la technique incluses",
                          ].map(f => (
                            <li key={f} className="flex items-start gap-2 text-sm text-white/60">
                              <Check className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />{f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Accès / paiement */}
                    {stats?.snap_rouge ? (
                      /* ── Accès débloqué ── */
                      <div className="card border-green-500/30 bg-green-500/5 text-center py-8">
                        <div className="w-14 h-14 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                          <Check className="w-7 h-7 text-green-400" />
                        </div>
                        <p className="font-black text-lg mb-1">Accès débloqué !</p>
                        <p className="text-white/45 text-sm mb-6">Vous avez accès à la technique complète Snap Rouge</p>
                        <Link
                          href="/snap-rouge"
                          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold transition-all shadow-lg shadow-red-500/25"
                        >
                          <Flame className="w-5 h-5" />
                          Accéder à la technique
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    ) : (
                      /* ── Pas encore d'accès ── */
                      <div className="card border-red-500/25 text-center py-8">
                        <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                          <Lock className="w-7 h-7 text-red-400" />
                        </div>
                        <p className="font-black text-lg mb-1">Débloquez la technique</p>
                        <p className="text-white/45 text-sm mb-6">Paiement unique — accès à vie immédiat</p>

                        <motion.button
                          onClick={handleSnapPurchase}
                          disabled={snapLoading}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold transition-all shadow-lg shadow-red-500/25 disabled:opacity-60"
                        >
                          {snapLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Flame className="w-5 h-5" />
                          )}
                          Débloquer pour 4,90€
                        </motion.button>

                        <div className="mt-6 pt-5 border-t border-surface-border max-w-sm mx-auto">
                          <p className="text-white/40 text-xs mb-3">
                            ✨ Ou inclus <strong className="text-white/70">gratuitement</strong> avec les abonnements{" "}
                            <span className="text-accent-violet font-bold">Pro</span> et{" "}
                            <span className="text-amber-400 font-bold">Elite</span>
                          </p>
                          <Link
                            href="/pricing"
                            className="text-accent-violet text-sm font-semibold hover:underline"
                          >
                            Voir les abonnements →
                          </Link>
                        </div>
                      </div>
                    )}

                  </div>
                </motion.div>
              )}

              {/* ══ SUBSCRIPTION VIEW ══ */}
              {navView === "subscription" && (
                <motion.div key="subscription" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                  {/* Fond noir + particules montantes */}
                  <div className="relative rounded-3xl bg-black border border-white/10 overflow-hidden px-4 sm:px-6 pb-8 mt-6 mb-6">
                    <RisingParticles />
                    <div className="relative z-10">
                      <div className="mb-8 pt-8">
                        <h1 className="text-3xl font-black mb-1">Formules</h1>
                        <p className="text-white/40">Choisissez l&apos;abonnement qui vous correspond</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6 items-center">
                        {PLANS_DATA.map((plan,i)=>{
                          const Icon       = plan.icon;
                          const isPro      = plan.id === "pro";
                          const isElite    = plan.id === "elite";
                          // Un compte gratuit n'a AUCUN plan actif : userPlanTier('free')
                          // retourne "essentiel" par défaut, donc on exige un plan payant.
                          const isCurrent  = isPaid && userPlanTier(stats?.plan) === plan.id;
                          return (
                            <motion.div key={plan.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0,scale:isPro?1.04:1}} transition={{delay:i*0.1}}
                              className={`card border ${plan.color} relative flex flex-col bg-[#0D0D0D] ${isPro ? "z-10 sm:py-8" : ""} ${isCurrent ? "ring-2 ring-offset-2 ring-offset-background " + plan.color.replace("border-","ring-") : ""}`}>
                              {isCurrent && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/40 whitespace-nowrap z-20">✓ Votre plan actuel</span>
                              )}
                              {!isCurrent && plan.badge && (
                                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full ${plan.badgeBg} ${plan.badgeText} border border-current z-20 ${isElite ? "gold-shimmer-text border-amber-400/60" : ""}`}>{plan.badge}</span>
                              )}
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl ${plan.badgeBg} flex items-center justify-center ${plan.badgeText}`}><Icon className="w-5 h-5" /></div>
                                <div>
                                  <p className={`font-bold ${isElite ? "gold-shimmer-text text-lg" : ""}`}>{plan.name}</p>
                                  <p className={`text-xs ${isElite ? "gold-shimmer-text font-bold" : plan.badgeText}`}>Générations illimitées</p>
                                </div>
                              </div>
                              <p className="text-3xl font-black mb-3">{plan.price}<span className="text-sm font-normal text-white/40">/mois</span></p>
                              {/* Highlights */}
                              <div className="grid grid-cols-3 gap-1 mb-4">
                                {plan.highlights.map(h=>(
                                  <div key={h.k} className="bg-white/5 rounded-lg p-1.5 text-center">
                                    <p className="text-white/30 text-[9px] uppercase tracking-wide">{h.k}</p>
                                    <p className={`text-[10px] font-bold leading-tight ${plan.badgeText}`}>{h.v}</p>
                                  </div>
                                ))}
                              </div>
                              <ul className="space-y-2 mb-5 flex-1">
                                {plan.features.map(f=>(
                                  <li key={f.t} className={`flex items-start gap-2 text-xs ${f.strong ? "text-white font-bold" : "text-white/50"}`}>
                                    <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${plan.badgeText}`} />{f.t}
                                  </li>
                                ))}
                              </ul>
                              {isCurrent ? (
                                <div className="w-full py-2.5 rounded-xl text-center text-sm font-semibold bg-green-500/10 text-green-400 border border-green-500/20">Plan actif</div>
                              ) : (
                                <Link href="/pricing" className="btn-primary text-center w-full text-sm py-2.5">Passer à {plan.name}</Link>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                      <div className="card bg-[#0D0D0D] flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent-violet/10 rounded-xl flex items-center justify-center text-accent-violet">
                          {isPaid ? <Crown className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-white/50 text-sm">{isPaid ? "Abonnement" : "Compte gratuit"}</p>
                          <p className="text-lg font-black text-accent-violet">
                            {isPaid ? "Générations illimitées" : "Aperçu flouté"}
                          </p>
                        </div>
                        {!isPaid && (
                          <Link href="/pricing" className="btn-ghost flex items-center gap-1 text-sm">
                            <Crown className="w-4 h-4" />Débloquer
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ══ SETTINGS VIEW ══ */}
              {navView === "settings" && (
                <motion.div key="settings" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                  <div className="mb-7 pt-8">
                    <h1 className="text-3xl font-black mb-1">Paramètres</h1>
                    <p className="text-white/40">Gérez votre compte</p>
                  </div>
                  <div className="max-w-md space-y-4">
                    <div className="card space-y-4">
                      <h2 className="font-bold">Informations du compte</h2>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-violet-neon flex items-center justify-center text-white text-xl font-black">{userInitial}</div>
                        <div>
                          <p className="font-semibold">{userEmail ?? "—"}</p>
                          <p className="text-white/40 text-sm">
                            Membre depuis {stats?.member_since ? new Date(stats.member_since).toLocaleDateString("fr-FR",{month:"long",year:"numeric"}) : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="card space-y-3">
                      <h2 className="font-bold">Statistiques</h2>
                      <div className="flex justify-between py-2 border-b border-surface-border">
                        <span className="text-white/50 text-sm">Générations totales</span>
                        <span className="font-bold">{stats?.total_generations ?? generations.length}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-surface-border">
                        <span className="text-white/50 text-sm flex items-center gap-1.5">
                          <span>📸</span> Images IA générées
                        </span>
                        <span className="font-bold">{stats?.image_generations ?? 0}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-surface-border">
                        <span className="text-white/50 text-sm flex items-center gap-1.5">
                          <span>🔄</span> SwapFace réalisés
                        </span>
                        <span className="font-bold">{stats?.swapface_generations ?? 0}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-surface-border">
                        <span className="text-white/50 text-sm flex items-center gap-1.5">
                          <span>🎬</span> Vidéos générées
                        </span>
                        <span className="font-bold">{stats?.video_generations ?? 0}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-white/50 text-sm">Abonnement</span>
                        <span className="font-bold text-accent-violet">
                          {isPaid ? `${userPlanTier(stats?.plan) === "elite" ? "Elite" : userPlanTier(stats?.plan) === "pro" ? "Pro" : "Essentiel"} · illimité` : "Gratuit (aperçu)"}
                        </span>
                      </div>
                    </div>
                    <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}} onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
                      <LogOut className="w-4 h-4" />Se déconnecter
                    </motion.button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </main>

      <LiveNotification />
      {upgradeTarget && (
        <PlanUpgradeModal target={upgradeTarget} onClose={() => setUpgradeTarget(null)} />
      )}
      <AnimatePresence>
        {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} />}
      </AnimatePresence>
    </div>
  );
}

/* ─── Auth gate modal (mode aperçu) ──────────────────────── */
function AuthGateModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        className="relative bg-surface border border-surface-border rounded-2xl p-7 max-w-sm w-full shadow-2xl text-center"
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ duration: 0.18 }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white text-xl leading-none transition-colors">✕</button>

        <div className="w-14 h-14 rounded-2xl bg-accent-violet/15 border border-accent-violet/30 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-accent-violet" />
        </div>
        <h3 className="font-black text-xl mb-2">Créez un compte pour générer</h3>
        <p className="text-white/45 text-sm mb-2 leading-relaxed">
          Vous êtes en mode aperçu. Inscrivez-vous gratuitement pour lancer votre première génération.
        </p>
        <div className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
          <Zap className="w-3.5 h-3.5" />
          Gratuit — aperçu sans carte bancaire
        </div>

        <Link
          href="/register"
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold mb-2"
        >
          <UserPlus className="w-4 h-4" />
          Créer mon compte gratuit
        </Link>
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-accent-violet/40 text-accent-violet hover:bg-accent-violet/10 text-sm font-bold transition-all"
        >
          <LogIn className="w-4 h-4" />
          J&apos;ai déjà un compte
        </Link>
      </motion.div>
    </div>
  );
}

/* ─── Plan upgrade modal ─────────────────────────────────── */
function PlanUpgradeModal({
  target,
  onClose,
}: {
  target: { plan: "pro" | "elite"; feature: string };
  onClose: () => void;
}) {
  const isPro = target.plan === "pro";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        className="relative bg-surface border border-surface-border rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ duration: 0.18 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPro ? "bg-accent-violet/20" : "bg-amber-400/20"}`}>
            {isPro
              ? <Star className="w-5 h-5 text-accent-violet" />
              : <Crown className="w-5 h-5 text-amber-400" />
            }
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white text-xl leading-none transition-colors">✕</button>
        </div>

        {/* Content */}
        <h3 className="font-black text-lg mb-1">
          Option {isPro ? "Pro" : "Elite"} uniquement
        </h3>
        <p className={`text-sm font-semibold mb-2 ${isPro ? "text-accent-violet" : "text-amber-400"}`}>
          {target.feature}
        </p>
        <p className="text-white/45 text-xs mb-5 leading-relaxed">
          Cette option est réservée au plan {isPro ? "Pro (19,90€/mois)" : "Elite (39,90€/mois)"}. Passez à un plan supérieur pour en profiter.
        </p>

        {/* CTA */}
        <Link
          href="/pricing"
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all mb-2 ${
            isPro
              ? "btn-primary"
              : "bg-gradient-to-r from-amber-400 to-accent-neon text-black hover:opacity-90"
          }`}
          onClick={onClose}
        >
          Voir les formules →
        </Link>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-white/35 hover:text-white text-sm transition-colors"
        >
          Continuer avec mon plan actuel
        </button>
      </motion.div>
    </div>
  );
}

/* ─── Small helpers ─────────────────────────────────────── */
function StepBadge({ n }: { n: number }) {
  return (
    <span className="w-6 h-6 bg-accent-violet rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {n}
    </span>
  );
}

function GenerateCard({
  consent, setConsent, error, onGenerate, onCancel, isGenerating, canGenerate, step, plan,
}: {
  consent: boolean;
  setConsent: (v: boolean) => void;
  error: string | null;
  onGenerate: () => void;
  onCancel?: () => void;
  isGenerating?: boolean;
  canGenerate: boolean;
  step: number;
  plan?: string;
}) {
  const qBadge = planQualityBadge(plan);
  const paid   = isPaidPlan(plan);
  return (
    <div className="card">
      <h2 className="font-bold text-base mb-4 flex items-center gap-2">
        <StepBadge n={step} />Générer
        <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border ${qBadge.color}`}>
          {qBadge.label}
        </span>
      </h2>

      <label className="flex items-start gap-3 cursor-pointer group mb-5">
        <div className="relative mt-0.5 flex-shrink-0">
          <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="sr-only" />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${consent?"bg-accent-violet border-accent-violet":"border-surface-border group-hover:border-accent-violet/50"}`}>
            {consent && <span className="text-white text-xs">✓</span>}
          </div>
        </div>
        <span className="text-white/55 text-sm leading-relaxed">
          Je confirme avoir le droit d&apos;utiliser ces médias et j&apos;accepte les{" "}
          <a href="/terms" className="text-accent-violet hover:underline">conditions d&apos;utilisation</a>.
        </span>
      </label>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl mb-4 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      {isGenerating ? (
        <motion.button
          onClick={onCancel}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3.5 text-base flex items-center justify-center gap-2 rounded-2xl border border-red-500/40 text-red-400 hover:bg-red-500/10 font-semibold transition-all"
        >
          <StopCircle className="w-5 h-5" />
          Arrêter la génération
        </motion.button>
      ) : (
        <motion.button
          onClick={onGenerate}
          disabled={!canGenerate}
          whileHover={canGenerate ? { scale: 1.02 } : {}}
          whileTap={canGenerate ? { scale: 0.97 } : {}}
          className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {canGenerate && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              animate={{ x: ["-120%", "220%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
            />
          )}
          <Sparkles className="w-5 h-5 relative z-10" />
          <span className="relative z-10">{paid ? `Générer ${qBadge.label}` : "Générer l'aperçu"}</span>
        </motion.button>
      )}

      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-white/25 flex-wrap">
        <span>🔒 Photo supprimée après traitement</span>
        <span>⚡ ~30–60s</span>
        <span>📐 {qBadge.label}</span>
      </div>
    </div>
  );
}
