import { z } from "@hono/zod-openapi";

export const CollectionLogItemSchema = z
  .object({
    id: z.number().openapi({ description: "Internal item ID" }),
    name: z.string(),
    quantity: z
      .number()
      .openapi({ description: "Number of this item obtained" }),
  })
  .openapi("CollectionLogItem");

export const CollectionLogPageSchema = z
  .object({
    name: z.string(),
    obtained: z
      .number()
      .openapi({ description: "Number of unique items obtained on this page" }),
    total: z
      .number()
      .openapi({ description: "Total number of unique items on this page" }),
    items: z.array(CollectionLogItemSchema),
  })
  .openapi("CollectionLogPage");

export const CollectionLogTabSchema = z
  .object({
    name: z.string(),
    obtained: z.number().openapi({
      description:
        "Number of unique items obtained across all pages in this tab",
    }),
    total: z.number().openapi({
      description: "Total number of unique items across all pages in this tab",
    }),
    pages: z.array(CollectionLogPageSchema),
  })
  .openapi("CollectionLogTab");

export const CollectionLogResponseSchema = z
  .object({
    obtained: z.number().openapi({
      description: "Total number of unique collection log items obtained",
    }),
    total: z.number().openapi({
      description:
        "Total number of unique collection log items across all tabs",
    }),
    tabs: z.array(CollectionLogTabSchema),
  })
  .openapi("CollectionLogResponse");

export const CollectionLogTabResponseSchema = CollectionLogTabSchema.openapi(
  "CollectionLogTabResponse",
);

export const CollectionLogPageResponseSchema = CollectionLogPageSchema.openapi(
  "CollectionLogPageResponse",
);
