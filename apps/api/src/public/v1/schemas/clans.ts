import { z } from "@hono/zod-openapi";

import { AccountTypeSchema } from "./shared";

export const ClanMemberSchema = z
  .object({
    username: z.string(),
    accountType: AccountTypeSchema,
    clan: z.object({
      rank: z
        .number()
        .openapi({ description: "Member's numeric rank within the clan" }),
      icon: z.number().openapi({ description: "Clan rank icon ID" }),
      title: z.string().openapi({ description: "Member's clan rank title" }),
    }),
  })
  .openapi("ClanMember");

export const ClanResponseSchema = z
  .object({
    name: z.string(),
    total: z
      .number()
      .openapi({ description: "Total number of tracked members in the clan" }),
    members: z.array(ClanMemberSchema),
    nextCursor: z
      .string()
      .nullable()
      .openapi({
        description: "Cursor for the next page, null if no more results",
      }),
    prevCursor: z
      .string()
      .nullable()
      .openapi({
        description: "Cursor for the previous page, null if at the start",
      }),
    hasMore: z
      .boolean()
      .openapi({ description: "Whether more members exist after this page" }),
    hasPrev: z
      .boolean()
      .openapi({ description: "Whether members exist before this page" }),
  })
  .openapi("ClanResponse");
