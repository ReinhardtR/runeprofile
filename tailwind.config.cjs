const plugin = require("tailwindcss/plugin");
const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{ts,tsx,mdx,md}", "./src/components/**/*.tsx"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        "1.5xl": "1570px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        mono: ["var(--font-mono)", ...fontFamily.mono],
        runescape: ["var(--font-runescape)"],
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: "calc(var(--radius) - 4px)",
      },
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
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // "light-gray": "rgb(230, 230, 230)",
        // background: {
        //   light: "rgb(30, 30, 30)",
        //   DEFAULT: "rgb(16, 16, 16)",
        //   dark: "rgb(10, 10, 10)",
        // },
        // primary: {
        //   light: "rgb(81, 91, 195)",
        //   DEFAULT: "rgb(80, 90, 190)",
        //   dark: "rgb(60, 60, 110)",
        // },
        // accent: "rgb(230, 200, 140)",
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
          white: "rgb(230, 230, 230)",
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
  },
  plugins: [
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
  ],
};
