import { Route } from "next";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

export const useSearchParamsUtils = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createParamsString = React.useCallback(
    (params: Record<string, string>) => {
      const newParams = new URLSearchParams(searchParams);
      for (const [name, value] of Object.entries(params)) {
        newParams.set(name, value);
      }
      return newParams.toString();
    },
    [searchParams]
  );

  const createPathString = React.useCallback(
    (params: Record<string, string>): Route => {
      return `${pathname}?${createParamsString(params)}` as Route;
    },
    [pathname, createParamsString]
  );

  return {
    createParamsString,
    createPathString,
  };
};
