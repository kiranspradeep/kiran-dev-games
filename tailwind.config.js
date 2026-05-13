/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface:    "#111111",
        card:       "#161616",
        accent:     "#C8A97E",
        primary:    "#e7e7e7",
        muted:      "#555555",
      },
      fontFamily: {
        cormorant: ["var(--font-cormorant-loaded)", "Cormorant Garamond", "serif"],
        inter:     ["var(--font-inter-loaded)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};