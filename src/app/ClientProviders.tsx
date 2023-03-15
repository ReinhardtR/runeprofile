"use client";

import React from "react";
import { ApiClientProvider } from "~/utils/api";

export function ClientProviders(props: { children: React.ReactNode }) {
  return <ApiClientProvider>{props.children}</ApiClientProvider>;
}
