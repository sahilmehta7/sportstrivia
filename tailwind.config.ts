import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import lineClamp from "@tailwindcss/line-clamp";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ===================
         MOBILE-FIRST SCREENS
         =================== */
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },

      /* ===================
         COLORS (from CSS vars)
         =================== */
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          elevated: "hsl(var(--card-elevated))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        /* Refined athletic accents */
        gold: "hsl(45 93% 47%)",
        steel: "hsl(215 25% 27%)",
      },

      /* ===================
         SPACING (touch-friendly)
         =================== */
      spacing: {
        'touch': 'var(--touch-target)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },

      /* ===================
         SIZING
         =================== */
      minHeight: {
        'touch': 'var(--touch-target)',
        'input': 'var(--input-height)',
        'input-sm': 'var(--input-height-sm)',
      },
      minWidth: {
        'touch': 'var(--touch-target)',
      },
      height: {
        'input': 'var(--input-height)',
        'input-sm': 'var(--input-height-sm)',
      },

      /* ===================
         BORDER RADIUS
         =================== */
      borderRadius: {
        'xl': 'var(--radius-xl)',
        'lg': 'var(--radius-lg)',
        'md': 'var(--radius)',
        'sm': 'var(--radius-sm)',
        'none': '0',
      },

      /* ===================
         TYPOGRAPHY
         =================== */
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        // Mobile-first type scale
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.15' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
      },

      /* ===================
         BACKDROP BLUR
         =================== */
      backdropBlur: {
        'glass': 'var(--glass-blur)',
        'glass-lg': 'calc(var(--glass-blur) * 1.5)',
      },

      /* ===================
         TRANSITIONS
         =================== */
      transitionDuration: {
        'fast': 'var(--transition-fast)',
        'base': 'var(--transition-base)',
        'slow': 'var(--transition-slow)',
      },
      transitionTimingFunction: {
        'smooth': 'var(--ease-smooth)',
      },

      /* ===================
         KEYFRAMES & ANIMATIONS
         =================== */
      keyframes: {
        "points-pop": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "counter-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "particle-burst": {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "scale(1.5) rotate(360deg)", opacity: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "0.8", filter: "brightness(1.3)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px hsl(var(--neon-cyan) / 0.4), 0 0 40px hsl(var(--neon-cyan) / 0.2)"
          },
          "50%": {
            boxShadow: "0 0 30px hsl(var(--neon-cyan) / 0.6), 0 0 60px hsl(var(--neon-cyan) / 0.3)"
          },
        },
        "border-glow": {
          "0%, 100%": {
            borderColor: "hsl(var(--neon-cyan) / 0.5)"
          },
          "50%": {
            borderColor: "hsl(var(--neon-magenta) / 0.5)"
          },
        },
      },
      animation: {
        "points-pop": "points-pop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "shimmer": "shimmer 2s infinite",
        "counter-up": "counter-up 0.6s ease-out",
        "particle-burst": "particle-burst 1s ease-out forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-up": "slide-up 0.4s var(--ease-smooth) forwards",
        "scale-in": "scale-in 0.3s var(--ease-smooth) forwards",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "border-glow": "border-glow 4s ease-in-out infinite",
      },

      /* ===================
         BOX SHADOWS
         =================== */
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.05)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.08)',
        'athletic': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [tailwindcssAnimate, lineClamp],
  blocklist: [".agent/"]
};

export default config;
