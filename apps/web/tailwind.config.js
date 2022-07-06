/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/pages/**/*.tsx", "./src/components/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        runescape: ["Runescape", "sans-serif"],
      },
      colors: {
        yellow: {
          osrs: "#ffff00",
        },
      },
    },
  },
  plugins: [],
};
