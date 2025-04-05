import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import { TooltipProvider } from "~/components/ui/tooltip";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootComponent,
  },
);

function RootComponent() {
  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={500}>
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </TooltipProvider>
  );
}
