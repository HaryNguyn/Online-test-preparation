/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--color-border, var(--border))",
        input: "var(--color-input, var(--input))",
        ring: "var(--color-ring, var(--ring))",
        background: "var(--color-background, var(--background))",
        foreground: "var(--color-foreground, var(--foreground))",
        primary: {
          DEFAULT: "var(--color-primary, var(--primary))",
          foreground: "var(--color-primary-foreground, var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "var(--color-secondary, var(--secondary))",
          foreground: "var(--color-secondary-foreground, var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "var(--color-muted, var(--muted))",
          foreground: "var(--color-muted-foreground, var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "var(--color-accent, var(--accent))",
          foreground: "var(--color-accent-foreground, var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "var(--color-destructive, var(--destructive))",
          foreground: "var(--color-destructive-foreground, var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "var(--color-card, var(--card))",
          foreground: "var(--color-card-foreground, var(--card-foreground))",
        },
        popover: {
          DEFAULT: "var(--color-popover, var(--popover))",
          foreground: "var(--color-popover-foreground, var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
