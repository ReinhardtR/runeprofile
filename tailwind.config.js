import { fontFamily as _fontFamily } from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export const content = [
  "./src/pages/**/*.tsx",
  "./src/components/**/*.tsx",
  "./src/app/**/*.tsx",
];
export const theme = {
  extend: {
    screens: {
      "1.5xl": "1570px",
    },
    fontFamily: {
      sans: ["Inter var", ..._fontFamily.sans],
      runescape: ["Runescape", "sans-serif"],
    },
    colors: {
      "light-gray": "rgb(230, 230, 230)",
      background: {
        light: "rgb(30, 30, 30)",
        DEFAULT: "rgb(16, 16, 16)",
        dark: "rgb(10, 10, 10)",
      },
      primary: {
        light: "rgb(81, 91, 195)",
        DEFAULT: "rgb(80, 90, 190)",
        dark: "rgb(60, 60, 110)",
      },
      accent: "rgb(230, 200, 140)",
      ranks: {
        "1st": "rgb(230, 200, 140)",
        "2nd": "rgb(170, 170, 170)",
        "3rd": "rgb(125, 75, 0)",
      },
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
    solidTextShadow: {
      DEFAULT: "1px 1px black, 1.5px 1.5px black, 2px 2px black",
    },
  },
};
export const plugins = [
  require("@tailwindcss/forms"),
  require("@tailwindcss/typography"),
  require("tailwindcss-animate"),
  plugin(({ matchUtilities, theme }) => {
    matchUtilities(
      {
        "solid-text-shadow": (value) => ({
          textShadow: value,
        }),
      },
      { values: theme("solidTextShadow") }
    );
  }),
];
