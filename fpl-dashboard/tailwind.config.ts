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
        fpl: {
          bg: "#0e0e1a",
          panel: "#1a1a2e",
          card: "#16213e",
          border: "rgba(139,92,246,0.2)",
          purple: "#8b5cf6",
          "purple-light": "#a855f7",
          pink: "#ec4899",
          cyan: "#06b6d4",
          green: "#10b981",
          amber: "#f59e0b",
          red: "#ef4444",
          "text-primary": "#f8fafc",
          "text-secondary": "#94a3b8",
        },
      },
      backgroundImage: {
        "purple-gradient": "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
        "card-gradient": "linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite linear",
      },
    },
  },
  plugins: [],
};
export default config;
