import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { UnexpectedErrorPage } from "~/shared/components/UnexpectedErrorPage";

import { routeTree } from "./routeTree.gen";

export function getRouter() {
  // Created per-request on the server — a shared client would leak one
  // user's cached profile data into another's SSR response.
  const queryClient = new QueryClient({
    defaultOptions: {
      // let the user refresh the page if they want to
      queries: {
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
    },
    defaultPreload: "intent",
    // Since we're using React Query, we don't want loader calls to ever be stale
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    defaultErrorComponent: UnexpectedErrorPage,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
