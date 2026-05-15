/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080810",
        surface:    "#0e0e1a",
        card:       "#12121e",
        accent:     "#C8A97E",
        neon:       "#00A8FF",
        primary:    "#e7e7e7",
        muted:      "#4a4a6a",
      },
      fontFamily: {
        cormorant: ["var(--font-cormorant-loaded)", "Cormorant Garamond", "serif"],
        inter:     ["var(--font-inter-loaded)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};