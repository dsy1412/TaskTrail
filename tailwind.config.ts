import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        glass: "0 20px 60px rgba(15, 23, 42, 0.10)",
        soft: "0 10px 30px rgba(31, 41, 55, 0.08)",
      },
      colors: {
        ink: "#1d1d1f",
        mist: "#f4f5f7",
        glass: "rgba(255, 255, 255, 0.72)",
      },
    },
  },
  plugins: [],
};

export default config;
