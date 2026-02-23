/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        actia: {
          navy:         "#2e4a6b",
          "navy-dark":  "#1e3450",
          "navy-light": "#3d5f84",
          green:        "#4ab83f",
          "green-dark": "#3a9a31",
          "green-light":"#6dcc63",
          bg:           "#f0f3f6",
          border:       "#dde4ec",
          muted:        "#6b82a0",
          surface:      "#ffffff",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "'Segoe UI'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "ui-monospace", "monospace"],
      },
      animation: {
        "fade-in-up":  "fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in":     "fadeIn 0.3s ease both",
        "slide-right": "slideRight 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "blob":        "blob 14s ease-in-out infinite",
        "float":       "floatY 3s ease-in-out infinite",
        "spin-fast":   "spin 0.7s linear infinite",
        "badge-pop":   "badgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        "pulse-dot":   "pulseDot 2s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideRight: {
          from: { opacity: "0", transform: "translateX(16px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        blob: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%":     { transform: "translate(40px,-30px) scale(1.06)" },
          "66%":     { transform: "translate(-25px,35px) scale(0.94)" },
        },
        floatY: {
          "0%,100%": { transform: "translateY(0)" },
          "50%":     { transform: "translateY(-8px)" },
        },
        badgePop: {
          "0%":  { transform: "scale(0.7)", opacity: "0" },
          "80%": { transform: "scale(1.08)" },
          "100%":{ transform: "scale(1)",   opacity: "1" },
        },
        pulseDot: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0.4" },
        },
      },
      boxShadow: {
        "card":    "0 1px 4px rgba(46,74,107,0.07), 0 1px 2px rgba(46,74,107,0.04)",
        "card-md": "0 4px 16px rgba(46,74,107,0.12)",
        "card-lg": "0 20px 50px rgba(30,52,80,0.22)",
        "green":   "0 4px 14px rgba(74,184,63,0.38)",
        "navy":    "0 4px 14px rgba(46,74,107,0.3)",
      },
      backgroundImage: {
        "navy-gradient": "linear-gradient(135deg,#1e3450 0%,#2e4a6b 60%,#3d5f84 100%)",
      },
    },
  },
  plugins: [],
}
