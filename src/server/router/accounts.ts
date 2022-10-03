import { createRouter } from "./context";
import { z } from "zod";

export const accountsRouter = createRouter().query("search", {
  input: z.object({
    query: z.string(),
  }),
  async resolve({ input, ctx }) {
    if (!input.query) {
      return {
        accounts: [],
      };
    }

    const query = input.query.trim();

    console.log(query);

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
  },
});
