import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import { SearchDialog } from "~/components/search-dialog";
import { TooltipProvider } from "~/components/ui/tooltip";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  { component: RootComponent },
);

function RootComponent() {
  return (
    <TooltipProvider>
      <Outlet />
      <SearchDialog />
    </TooltipProvider>
  );
}
