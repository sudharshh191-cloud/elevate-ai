/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "#F8F9FC",
        surface: "#FFFFFF",
        "surface-card": "#FFFFFF",
        "surface-muted": "#F1F5F9",
        "surface-hover": "#F8FAFC",
        border: {
          subtle: "#E2E8F0",
          card: "#E2E8F0",
          strong: "#CBD5E1",
        },
        text: {
          primary: "#0F172A",
          secondary: "#64748B",
          muted: "#94A3B8",
        },
        primary: {
          DEFAULT: "#4F46E5", // Modern Indigo
          hover: "#4338CA",
          light: "#EEF2FF",
          glow: "rgba(79, 70, 229, 0.15)",
        },
        emerald: {
          accent: "#10B981",
          light: "#ECFDF5",
          glow: "rgba(16, 185, 129, 0.15)",
        },
        cyan: {
          accent: "#0EA5E9",
          light: "#F0F9FF",
        },
        rose: {
          accent: "#EF4444",
          light: "#FEF2F2",
        },
        amber: {
          accent: "#F59E0B",
          light: "#FFFBEB",
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1.0)' },
        }
      }
    },
  },
  plugins: [],
}
