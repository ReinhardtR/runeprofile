import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { NextRequest } from "next/server";
import { createContext } from "~/server/trpc/context";
import { appRouter } from "~/server/trpc/router/_app";

export const config = {
  runtime: "edge",
  regions: ["iad1"],
};

export default async function handler(req: NextRequest) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createContext,
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(`❌ tRPC failed on ${path}: ${error}`);
          }
        : undefined,
  });
}
