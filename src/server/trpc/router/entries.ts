import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { getCollectionLogEntry } from "~/lib/domain/collection-log";

export const entriesRouter = router({
  byName: publicProcedure
    .input(
      z.object({
        username: z.string(),
        tabName: z.string(),
        entryName: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return {
        entry: {
          name: "TEST",
        },
      };

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      return {
        entry,
      };
    }),
});
