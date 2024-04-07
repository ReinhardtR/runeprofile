"use client";

import { TooltipProvider } from "~/components/ui/tooltip";

export function Providers(props: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={500}>
      {props.children}
    </TooltipProvider>
  );
}
