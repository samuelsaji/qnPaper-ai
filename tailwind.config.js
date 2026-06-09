/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "brand-primary": "var(--brand-primary)",
        "brand-primary-light": "var(--brand-primary-light)",
        "brand-primary-muted": "var(--brand-primary-muted)",
        "brand-secondary": "var(--brand-secondary)",
        "brand-surface": "var(--brand-surface)",
        "brand-border": "var(--brand-border)",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(28,28,28,0.06)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
