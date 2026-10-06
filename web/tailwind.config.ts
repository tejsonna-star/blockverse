import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0b0e14",
          panel: "#141924",
          accent: "#5b8def",
        },
      },
    },
  },
  plugins: [],
};

export default config;
