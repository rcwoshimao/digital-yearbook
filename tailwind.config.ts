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
        yearbook: {
          paper: "#fff8ed",
          ink: "#27211b",
          accent: "#8f5f35",
        },
      },
    },
  },
  plugins: [],
};

export default config;
