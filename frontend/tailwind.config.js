/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./app.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Raleway-Regular", "sans-serif"],
        medium: ["Raleway-Medium", "sans-serif"],
        semibold: ["Raleway-SemiBold", "sans-serif"],
        bold: ["Raleway-Bold", "sans-serif"],
        black: ["Raleway-Black", "sans-serif"],
      },
      colors: require("./constants/theme-colors.json"),
    },
  },
  plugins: [],
};
