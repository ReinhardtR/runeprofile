import type { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";

import { GlobalAlertBanner } from "~/features/alerts";
import { SearchDialog } from "~/features/search";
import { TooltipProvider } from "~/shared/components/ui/tooltip";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  { component: RootComponent },
);

function RootComponent() {
  return (
    <>
      <HeadContent />
      <TooltipProvider>
        <GlobalAlertBanner />
        <Outlet />
        <SearchDialog />
      </TooltipProvider>
    </>
  );
}
