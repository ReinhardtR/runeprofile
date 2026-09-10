import { zValidator as zv } from "@hono/zod-validator";
import { ValidationTargets } from "hono/types";
import { ZodSchema, z } from "zod";

import {
  AccountTypes,
  ActivityEventTypeSchema,
  COLLECTION_LOG_TABS,
} from "@runeprofile/runescape";

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

// Bounded because the page feeds an OFFSET and getGroupActivities' inner LIMIT.
export const paginationPageSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(1000)
  .optional()
  .catch(undefined);

export const cursorSchema = z.string().optional();

export const directionSchema = z
  .enum(["next", "prev"])
  .optional()
  .default("next");

export const limitSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(100)
  .optional()
  .default(10);

export const activityTypesSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return undefined;
    const types = val
      .split(",")
      .filter(
        (t): t is z.infer<typeof ActivityEventTypeSchema> =>
          ActivityEventTypeSchema.safeParse(t).success,
      );
    return types.length > 0 ? types : undefined;
  });

export const validator = <
  T extends ZodSchema,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T,
) =>
  zv(target, schema, (result, c) => {
    if (!result.success) {
      // Log the issues, not the payload — a failed profile sync body can be
      // 100KB+ of collection log data.
      console.log({
        event: "validation_failed",
        target,
        issues: result.error.issues.slice(0, 10).map((issue) => ({
          path: issue.path.join("."),
          code: issue.code,
          message: issue.message,
        })),
      });
      return c.json(result.error, 400);
    }
  });
