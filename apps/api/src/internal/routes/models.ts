import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { cache } from "hono/cache";
import { z } from "zod";

import { accounts, drizzle } from "@runeprofile/db";

import {
  RuneProfileAccountNotFoundError,
  RuneProfileFailedToUploadFileError,
  RuneProfileFileNotFoundError,
} from "~/lib/errors";
import { newRouter } from "~/lib/helpers";
import { createPetModelKey, createPlayerModelKey } from "~/lib/models/keys";
import { uploadPlayerModels } from "~/lib/models/manage-models";
import { modelContentType, modelFileSchema } from "~/lib/models/uploads";
import { STATUS } from "~/lib/status";
import { accountIdSchema, usernameSchema, validator } from "~/lib/validation";

/** Statuses that carry no body, so they are not in {@link STATUS}. */
const NO_CONTENT = 204;
const NOT_MODIFIED = 304;

const CACHE_SECONDS = 60;

/**
 * Revalidate in the browser, serve from the edge for a minute.
 *
 * The `cache` middleware below is what makes the edge part work: a Worker
 * response is not stored merely because it carries `s-maxage`. Cloudflare's
 * newer Workers Cache does work off headers alone, but it is per Worker and
 * applies to every route, where a GET with no `Cache-Control` would fall to
 * heuristic freshness and be cached for two hours - so enabling it means
 * auditing every GET on this API first.
 */
const CACHE_CONTROL = `public, max-age=0, s-maxage=${CACHE_SECONDS}`;

const usernameParam = validator(
  "param",
  z.object({ username: usernameSchema.transform((v) => v.toLowerCase()) }),
);

/**
 * Player and pet models, mounted under `/profiles/models`.
 *
 * Served as bytes rather than base64 in JSON, which inflated every model by a
 * third and held the file, its encoding and the response in Worker memory at
 * once. Player and pet are separate routes so each caches on its own: a pet
 * changes independently of the character, and the group page never asks for one.
 */
export const modelsRouter = newRouter()
  .post(
    "/",
    validator(
      "form",
      z.object({
        accountId: accountIdSchema,
        model: modelFileSchema,
        petModel: modelFileSchema.optional(),
      }),
    ),
    async (c) => {
      const db = drizzle(c.env.HYPERDRIVE);
      const { accountId, model, petModel } = c.req.valid("form");

      const account = await db.query.accounts.findFirst({
        where: eq(accounts.id, accountId),
        columns: { username: true },
      });

      if (!account) {
        throw RuneProfileAccountNotFoundError;
      }

      try {
        await uploadPlayerModels(
          c.env.BUCKET,
          account.username,
          { body: model.stream(), contentType: modelContentType(model.name) },
          petModel && {
            body: petModel.stream(),
            contentType: modelContentType(petModel.name),
          },
        );
      } catch (error) {
        throw RuneProfileFailedToUploadFileError;
      }

      return c.json({ message: "Model updated successfully" });
    },
  )
  .get(
    "/:username",
    usernameParam,
    cache({ cacheName: "profile-model", cacheControl: CACHE_CONTROL }),
    async (c) =>
      serveModel(c, createPlayerModelKey(c.req.valid("param").username), {
        onMissing: "error",
      }),
  )
  .get(
    "/:username/pet",
    usernameParam,
    cache({ cacheName: "profile-pet-model", cacheControl: CACHE_CONTROL }),
    async (c) =>
      serveModel(c, createPetModelKey(c.req.valid("param").username), {
        onMissing: "empty",
      }),
  );

async function serveModel(
  c: Context<{ Bindings: Env }>,
  key: string,
  { onMissing }: { onMissing: "error" | "empty" },
) {
  // Passing the request's validators to R2 answers an unchanged model without
  // reading its body.
  const object = await c.env.BUCKET.get(key, { onlyIf: c.req.raw.headers });

  if (!object) {
    // A character with no pet out is normal, and a 404 per profile view would
    // look like a fault.
    if (onMissing === "error") {
      throw RuneProfileFileNotFoundError;
    }
    return c.body(null, NO_CONTENT, { "Cache-Control": CACHE_CONTROL });
  }

  const headers = {
    "Cache-Control": CACHE_CONTROL,
    ETag: object.httpEtag,
    // Recorded at upload. Readers still sniff the leading bytes, because objects
    // stored before it was recorded have none.
    "Content-Type":
      object.httpMetadata?.contentType ?? "application/octet-stream",
  };

  // R2 returns metadata without a body when the validators matched.
  if (!("body" in object)) {
    return c.body(null, NOT_MODIFIED, headers);
  }

  return c.body(object.body, STATUS.OK, headers);
}
