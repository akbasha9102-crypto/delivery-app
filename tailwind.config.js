/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4f46e5",
        success: "#10b981",
        warning: "#f59e0b",
        info: "#06b6d4",
        accent: "#ff4757",
        delivery: "#8b5cf6",
        background: "#eefcfd",
        surface: "#ffffff",
      },
    },
  },
  plugins: [],
}
