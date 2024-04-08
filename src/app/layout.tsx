import {
  JetBrains_Mono as FontMono,
  Inter as FontSans,
} from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";

import { Providers } from "~/app/Providers";

import "~/styles/globals.css";

import { cn } from "~/lib/utils/cn";
import { TailwindIndicator } from "~/components/misc/tailwind-indicator";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const fontOsrs = localFont({
  src: [
    {
      path: "../assets/fonts/runescape.woff2",
      weight: "normal",
    },
    {
      path: "../assets/fonts/runescape-bold.woff2",
      weight: "bold",
    },
  ],
  variable: "--font-runescape",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>RuneProfile</title>
        <meta
          name="description"
          content="RuneProfile is a website and RuneLite plugin that allows you to track and share your Old School RuneScape progress and achievements."
        />
      </head>
      <body
        className={cn(
          "m-0 min-h-screen scroll-smooth bg-background font-sans text-foreground",
          fontSans.variable,
          fontMono.variable,
          fontOsrs.variable
        )}
      >
        <Providers>
          {/* <SearchDialog /> */}
          {props.children}
        </Providers>
        <TailwindIndicator />
        <Analytics />
      </body>
    </html>
  );
}
