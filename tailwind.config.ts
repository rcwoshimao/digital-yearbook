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
          paper: "var(--yearbook-paper)",
          "paper-deep": "var(--yearbook-paper-deep)",
          ink: "var(--yearbook-ink)",
          accent: "var(--yearbook-accent)",
          page: "var(--yearbook-page)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
