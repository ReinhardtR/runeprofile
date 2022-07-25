import { z } from "zod";

export const collectionLogSchema = z.object({
  total_obtained: z.number(),
  total_items: z.number(),
  unique_obtained: z.number(),
  unique_items: z.number(),
  tabs: z.record(
    z.record(
      z.object({
        items: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
            quantity: z.number(),
            obtained: z.boolean(),
          })
        ),
        killCounts: z
          .array(
            z.record(
              z.object({
                name: z.string(),
                amount: z.number(),
              })
            )
          )
          .optional(),
      })
    )
  ),
});
