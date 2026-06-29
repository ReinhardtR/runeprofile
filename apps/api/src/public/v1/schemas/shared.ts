import { z } from "@hono/zod-openapi";

export const ErrorSchema = z
  .object({
    error: z.string(),
    code: z.string(),
  })
  .openapi("Error");

export const UsernameParam = z
  .string()
  .min(1)
  .max(12)
  .openapi({
    param: { name: "username", in: "path" },
    example: "pgn",
    description: "The player's RuneScape username",
  });

export const ClanNameParam = z
  .string()
  .min(1)
  .max(100)
  .openapi({
    param: { name: "name", in: "path" },
    example: "The Pax",
    description: "The clan name",
  });

export const CursorQuery = z
  .string()
  .optional()
  .openapi({
    param: { name: "cursor", in: "query" },
    description: "Opaque cursor for pagination. Omit for first page.",
  });

export const DirectionQuery = z
  .enum(["next", "prev"])
  .optional()
  .default("next")
  .openapi({
    param: { name: "direction", in: "query" },
    description: "Pagination direction relative to cursor",
  });

export const AccountTypeSchema = z
  .object({
    id: z.number(),
    key: z.string(),
    name: z.string(),
  })
  .openapi("AccountType");

// --- Shared error responses ---

const errorContent = {
  "application/json": { schema: ErrorSchema },
};

export const BadRequestResponse = {
  content: errorContent,
  description: "Validation error (invalid parameters or query)",
} as const;

export const NotFoundResponse = {
  content: errorContent,
  description: "Resource not found",
} as const;

export const RateLimitResponse = {
  content: errorContent,
  description: "Rate limit exceeded",
} as const;

export const InternalErrorResponse = {
  content: errorContent,
  description: "Internal server error",
} as const;
