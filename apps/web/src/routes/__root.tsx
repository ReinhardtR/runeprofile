import type { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";

import globalCss from "~/core/styles/global.css?url";
import { GlobalAlertBanner } from "~/features/alerts";
import { SearchDialog } from "~/features/search";
import { TooltipProvider } from "~/shared/components/ui/tooltip";

const DESCRIPTION =
  "RuneProfile is a website and RuneLite plugin that allows you to track and share your Old School RuneScape progress and achievements.";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootComponent,
    shellComponent: RootDocument,
    head: () => ({
      meta: [
        { charSet: "UTF-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
        // Default title; deeper routes override it.
        { title: "RuneProfile" },
        { name: "description", content: DESCRIPTION },
        { property: "og:site_name", content: "RuneProfile" },
        { property: "og:type", content: "website" },
        { property: "og:title", content: "RuneProfile" },
        { property: "og:description", content: DESCRIPTION },
        {
          property: "og:image",
          content: "https://runeprofile.com/logo-512x512.png",
        },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: "RuneProfile" },
        { name: "twitter:description", content: DESCRIPTION },
      ],
      links: [
        { rel: "manifest", href: "/manifest.json" },
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "stylesheet", href: globalCss },
      ],
    }),
  },
);

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="m-0 min-h-svh scroll-smooth bg-background font-sans text-foreground overscroll-none">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <TooltipProvider>
        <GlobalAlertBanner />
        <Outlet />
        <SearchDialog />
      </TooltipProvider>
    </>
  );
}
