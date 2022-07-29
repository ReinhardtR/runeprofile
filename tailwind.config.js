/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/pages/**/*.tsx", "./src/components/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        runescape: ["Runescape", "sans-serif"],
      },
      colors: {
        osrs: {
          yellow: "rgb(255, 255, 0)",
          orange: "rgb(255, 132, 31)",
          red: "rgb(212, 0, 0)",
          green: "rgb(55, 181, 20)",
          gray: "rgb(130, 127, 123)",
          tab: "rgb(17, 17, 17)",
          "tab-selected": "rgb(32, 32, 32)",
          border: "rgb(62, 62, 62)",
          "dark-border": "rgb(40, 40, 40)",
          "diary-low": "rgb(212, 68, 0)",
          "diary-med": "rgb(210, 112, 0)",
          "diary-high": "rgb(209, 150, 0)",
        },
      },
      dropShadow: {
        solid: "2px 2px 0 black",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
