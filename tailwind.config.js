/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        success: "#10b981",
        warning: "#f59e0b",
        info: "#06b6d4",
        accent: "#000000",
        delivery: "#000000",
        background: "#ffffff",
        surface: "#ffffff",
      },
    },
  },
  plugins: [],
}
