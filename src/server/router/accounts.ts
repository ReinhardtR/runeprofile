import { createRouter } from "./context";
import { z } from "zod";
import e from "@/edgeql";

const searchQuery = e.params({ query: e.str }, ($) => {
  return e.select(e.Account, (account) => ({
    account_type: true,
    username: true,
    filter: e.op(account.username, "ilike", $.query),
  }));
});

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

    const query = "%" + input.query.trim() + "%";

    console.log(query);

    const accounts = await searchQuery.run(ctx.edgedb, { query });

    return {
      query,
      accounts,
    };
  },
});
