import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: "#FAF7F2",
          50: "#FCFBF8",
          100: "#FAF7F2",
          200: "#F4EEE2",
          300: "#ECE2D0",
          400: "#DECEB6",
          500: "#CDAF8B",
        },
        charcoal: {
          DEFAULT: "#1C1917",
          50: "#78716C",
          100: "#57534E",
          200: "#44403C",
          300: "#292524",
          400: "#1C1917",
          800: "#171412",
          900: "#100E0D",
          950: "#080707",
        },
        gold: {
          DEFAULT: "#C5A869",
          50: "#FCF9F2",
          100: "#F7F0DF",
          200: "#EEDDBB",
          300: "#DEC38E",
          400: "#C5A869",
          500: "#B38F4D",
          600: "#967236",
          700: "#745424",
          800: "#573C18",
        },
        heritage: {
          crimson: "#881337",
          vermilion: "#9E2A2B",
          emerald: "#1B4332",
          saffron: "#C86414",
          indigo: "#1E293B",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Cinzel", "Cormorant Garamond", "serif"],
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      boxShadow: {
        luxury: "0 10px 30px -10px rgba(28, 25, 23, 0.08)",
        "luxury-lg": "0 20px 40px -15px rgba(28, 25, 23, 0.12)",
        gold: "0 4px 20px -2px rgba(197, 168, 105, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
