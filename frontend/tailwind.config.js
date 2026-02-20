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
          navy:       "#2e4a6b",
          "navy-dark":"#1e3450",
          "navy-light":"#3d5f84",
          green:      "#4ab83f",
          "green-dark":"#3a9a31",
          "green-light":"#6dcc63",
          bg:         "#f0f3f6",
          border:     "#dde4ec",
          muted:      "#6b82a0",
        },
      },
      fontFamily: {
        sans: ["'Segoe UI'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
