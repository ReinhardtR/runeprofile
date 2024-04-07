import React from "react";
import { Route } from "next";
import { usePathname, useSearchParams } from "next/navigation";

export const useSearchParamsUtils = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const utils = React.useMemo(
    () => ({
      createParamsString: (newParams: Record<string, string>) => {
        return createParamsString(searchParams, newParams);
      },
      createPathString: (newParams: Record<string, string>) => {
        return createPathString(pathname, searchParams, newParams);
      },
    }),
    [pathname, searchParams]
  );

  return utils;
};

const createParamsString = (
  params: URLSearchParams,
  newParams: Record<string, string>
) => {
  const paramsCopy = new URLSearchParams(params.toString());
  for (const [name, value] of Object.entries(newParams)) {
    params.set(name, value);
  }
  return params.toString();
};

const createPathString = (
  pathname: string,
  params: URLSearchParams,
  newParams: Record<string, string>
) => {
  const paramsCopy = new URLSearchParams();
  for (const [name, value] of Object.entries(newParams)) {
    paramsCopy.set(name, value);
  }
  return `${pathname}?${paramsCopy.toString()}` as Route;
};
