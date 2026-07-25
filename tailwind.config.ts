import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          950: "#07080c",
          900: "#0d0f16",
          800: "#151821",
          750: "#1b1f2a",
          700: "#632323",
          600: "#6f7788",
        },
        light: "#f7f8fb",
        accent: {
          blue: "#ef2f2f",
          red: "#ff3d5f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
