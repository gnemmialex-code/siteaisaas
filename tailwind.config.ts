import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D0D0D",
        foreground: "#FFFFFF",
        accent: {
          violet: "#8A2BE2",
          neon: "#00E5FF",
        },
        surface: {
          DEFAULT: "#161616",
          hover: "#1E1E1E",
          border: "#2A2A2A",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-violet-neon":
          "linear-gradient(135deg, #8A2BE2 0%, #00E5FF 100%)",
        "gradient-dark":
          "linear-gradient(180deg, #0D0D0D 0%, #161616 100%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-violet": "glowViolet 2s ease-in-out infinite alternate",
        "glow-neon": "glowNeon 2s ease-in-out infinite alternate",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        glowViolet: {
          "0%": { boxShadow: "0 0 5px #8A2BE2, 0 0 10px #8A2BE2" },
          "100%": { boxShadow: "0 0 20px #8A2BE2, 0 0 40px #8A2BE2" },
        },
        glowNeon: {
          "0%": { boxShadow: "0 0 5px #00E5FF, 0 0 10px #00E5FF" },
          "100%": { boxShadow: "0 0 20px #00E5FF, 0 0 40px #00E5FF" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        violet: "0 0 20px rgba(138, 43, 226, 0.5)",
        neon: "0 0 20px rgba(0, 229, 255, 0.5)",
        "violet-lg": "0 0 40px rgba(138, 43, 226, 0.7)",
        "neon-lg": "0 0 40px rgba(0, 229, 255, 0.7)",
      },
    },
  },
  plugins: [],
};

export default config;
