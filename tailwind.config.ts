import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand palette - colorful
        brand: {
          50: "#eff6ff", 100: "#dbeafe", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8",
        },
        emerald: {
          50: "#ecfdf5", 100: "#d1fae5", 500: "#10b981", 600: "#059669",
        },
        violet: {
          50: "#f5f3ff", 100: "#ede9fe", 500: "#8b5cf6", 600: "#7c3aed",
        },
        amber: {
          50: "#fffbeb", 100: "#fef3c7", 500: "#f59e0b", 600: "#d97706",
        },
        rose: {
          50: "#fff1f2", 100: "#ffe4e6", 500: "#f43f5e", 600: "#e11d48",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.6s linear infinite",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
        "gradient-emerald": "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
        "gradient-amber": "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
        "gradient-violet": "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
        "gradient-rose": "linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
