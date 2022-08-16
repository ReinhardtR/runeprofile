import { createRouter } from "../context";
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
    console.log(input);

    return {
      accounts: [
        {
          account_type: "IRONMAN",
          username: "PGN",
        },
        {
          account_type: "NORMAL",
          username: "B0aty",
        },
        {
          account_type: "ULTIMATE_IRONMAN",
          username: "Settled",
        },
        {
          account_type: "IRONMAN",
          username: "Lost Fauxcus",
        },
        {
          account_type: "NORMAL",
          username: "7asty",
        },
      ],
    };

    if (!input.query) {
      return {
        accounts: [],
      };
    }

    const query = "%" + input.query.trim() + "%";

    console.log(query);

    const accounts = await searchQuery.run(ctx.client, { query });

    return {
      query,
      accounts,
    };
  },
});
