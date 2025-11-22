import type { Config } from "tailwindcss";

export default {
  darkMode: "class", // required for manual dark mode toggle
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      transitionProperty: {
        theme: "background-color, color, border-color",
      },
    },
  },
  plugins: [],
} satisfies Config;
