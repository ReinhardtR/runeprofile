import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";

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
      const account = await ctx.prisma.account.findUnique({
        where: {
          username: input.username,
        },
        select: {
          accountHash: true,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      const entry = await ctx.prisma.entry.findUnique({
        where: {
          accountHash_tabName_name: {
            accountHash: account.accountHash,
            tabName: input.tabName,
            name: input.entryName,
          },
        },
        select: {
          name: true,
          killCounts: {
            select: {
              name: true,
              count: true,
            },
            orderBy: {
              index: "asc",
            },
          },
          items: {
            select: {
              id: true,
              name: true,
              quantity: true,
              obtainedAt: {
                select: {
                  date: true,
                  killCounts: {
                    select: {
                      name: true,
                      count: true,
                    },
                    orderBy: {
                      index: "asc",
                    },
                  },
                },
              },
            },
            orderBy: {
              index: "asc",
            },
          },
        },
      });

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
