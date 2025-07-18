import { zValidator as zv } from "@hono/zod-validator";
import { ValidationTargets } from "hono/types";
import { ZodSchema, z } from "zod";

import { AccountTypes, COLLECTION_LOG_TABS } from "@runeprofile/runescape";

export const accountIdSchema = z.string().trim().length(28);

export const usernameSchema = z.string().trim().min(1).max(12);
export const clanNameSchema = z.string().trim().min(1).max(12);

export const accountTypeSchema = z.string().transform((val, ctx) => {
  const accountTypeId = Object.values(AccountTypes).find(
    (t) => t.key === val,
  )?.id;

  if (accountTypeId === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid account type key",
    });
    return z.NEVER;
  }

  return accountTypeId;
});

export const collectionLogPageSchema = z.string().transform((val, ctx) => {
  const pageId = COLLECTION_LOG_TABS.flatMap((tab) =>
    tab.pages.map((p) => p.name.toLowerCase()),
  ).find((p) => p === val.toLowerCase());

  if (pageId === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid collection log page",
    });
    return z.NEVER;
  }

  return pageId;
});

export const paginationPageSchema = z.coerce
  .number()
  .optional()
  .catch(undefined);

export const validator = <
  T extends ZodSchema,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T,
) =>
  zv(target, schema, (result, c) => {
    if (!result.success) {
      console.error(result.error);
      console.error(result.data);
      return c.json(result.error, 400);
    }
  });
