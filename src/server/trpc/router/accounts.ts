import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const accountsRouter = router({
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const query = input.query.trim();

      if (query == "") {
        return {
          query,
          accounts: [],
        };
      }

      const accounts = await ctx.prisma.account.findMany({
        where: {
          username: {
            search: query,
          },
          isPrivate: false,
        },
        select: {
          username: true,
          accountType: true,
        },
      });

      return {
        query,
        accounts,
      };
    }),
});
