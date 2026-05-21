import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand — exact hex values from the design file (colors_and_type.css).
        // Blue is the workhorse, gold is the awards-only accent.
        "bwiga-blue": {
          DEFAULT: "#3083C6",
          bright: "#4FA1DC",
          deep: "#1F6BAA",
        },
        "bwiga-gold": {
          DEFAULT: "#D9B26A",
          bright: "#E8C988",
          deep: "#BF9352",
        },
        ink: {
          0: "#05070D",
          1: "#0A0E1A",
          2: "#11172A",
          3: "#1C233B",
          4: "#2A3251",
        },
        paper: {
          0: "#FFFFFF",
          1: "#E6E9F5",
        },
      },
      fontFamily: {
        display: ["var(--font-inter)", "system-ui", "-apple-system", "Helvetica Neue", "Arial", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "-apple-system", "Helvetica Neue", "Arial", "sans-serif"],
      },
      letterSpacing: {
        eyebrow: "0.18em",
        tightish: "-0.02em",
        snug: "-0.01em",
      },
    },
  },
  plugins: [],
};
export default config;
