const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/pages/**/*.tsx", "./src/components/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
        runescape: ["Runescape", "sans-serif"],
      },
      colors: {
        "light-gray": "rgb(230, 230, 230)",
        background: {
          light: "rgb(30, 30, 30)",
          DEFAULT: "rgb(13, 13, 13)",
          dark: "rgb(10, 10, 10)",
        },
        primary: "rgb(70, 70, 135)",
        accent: "rgb(230, 200, 140)",
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
        "solid-sm": "1px 1px 0 black",
        solid: "2px 2px 0 black",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
