import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const leaderboardsRouter = router({
  collection: publicProcedure
    .input(
      z.object({
        page: z.number().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const pageSize = 10;
      const { page } = input;

      const [totalAccounts, pageData] = await ctx.prisma.$transaction([
        ctx.prisma.account.count({
          where: {
            isPrivate: false,
            collectionLog: {
              isNot: undefined,
            },
          },
        }),
        ctx.prisma.collectionLog.findMany({
          take: pageSize,
          skip: (page - 1) * pageSize,
          where: {
            account: {
              isPrivate: false,
            },
          },
          select: {
            uniqueItemsObtained: true,
            uniqueItemsTotal: true,
            account: {
              select: {
                username: true,
                accountType: true,
              },
            },
          },
          orderBy: {
            uniqueItemsObtained: "desc",
          },
        }),
      ]);

      return {
        pageSize,
        currentPage: page,
        totalPages: Math.ceil(totalAccounts / pageSize),
        hasNextPage: page * pageSize < totalAccounts,
        pageData,
      };
    }),
});
