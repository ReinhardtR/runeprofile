import { eq } from "drizzle-orm";
import { cache } from "hono/cache";
import { z } from "zod";

import { accounts, drizzle } from "~/db";
import { getCollectionLogPage } from "~/lib/get-collection-log-page";
import { getProfile } from "~/lib/get-profile";
import { STATUS, newRouter } from "~/lib/helpers";
import { searchProfiles } from "~/lib/search-profiles";
import { updateProfile } from "~/lib/update-profile";
import { accountIdSchema, usernameSchema, validator } from "~/lib/validation";

export const profilesRouter = newRouter()
  .get("/", validator("query", z.object({ q: z.string() })), async (c) => {
    const db = drizzle(c.env.DB);
    const { q } = c.req.valid("query");
    try {
      const profiles = await searchProfiles(db, q);
      return c.json(profiles, STATUS.OK);
    } catch (error) {
      console.error(error);
      return c.json(
        { error: "Something went wrong" },
        STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  })
  .get(
    "/:username",
    validator("param", z.object({ username: usernameSchema })),
    cache({ cacheName: "profile", cacheControl: "max-age=60" }),
    async (c) => {
      const db = drizzle(c.env.DB);

      const { username } = c.req.valid("param");

      console.log("Fetching profile for: ", username);

      try {
        const profile = await getProfile(db, username);
        if (!profile) {
          return c.json({ error: "Profile not found" }, STATUS.NOT_FOUND);
        }
        return c.json(profile, STATUS.OK);
      } catch (error) {
        console.error(error);
        return c.json(
          { error: "Something went wrong" },
          STATUS.INTERNAL_SERVER_ERROR,
        );
      }
    },
  )

  .get(
    "/:username/collection-log/:page",
    validator(
      "param",
      z.object({
        username: usernameSchema,
        page: z.string(),
      }),
    ),
    cache({ cacheName: "clog-page", cacheControl: "max-age=60" }),
    async (c) => {
      const db = drizzle(c.env.DB);

      const { username, page } = c.req.valid("param");

      console.log("Fetching collection log page for: ", username, page);

      try {
        const collectionLogPage = await getCollectionLogPage(
          db,
          username,
          page,
        );

        return c.json(collectionLogPage, STATUS.OK);
      } catch (error) {
        console.error(error);
        return c.json(
          { error: "Something went wrong" },
          STATUS.INTERNAL_SERVER_ERROR,
        );
      }
    },
  )
  .post(
    "/",
    validator(
      "json",
      z.object({
        id: accountIdSchema,
        username: usernameSchema,
        accountType: z.number(),
        achievementDiaryTiers: z.array(
          z.object({
            areaId: z.number(),
            tierIndex: z.number(),
            completedCount: z.number(),
          }),
        ),
        combatAchievementTiers: z.record(z.coerce.number(), z.number()),
        items: z.record(z.coerce.number(), z.number()),
        quests: z.record(z.coerce.number(), z.number()),
        skills: z.record(z.string(), z.number()),
      }),
    ),
    async (c) => {
      const db = drizzle(c.env.DB);

      const data = c.req.valid("json");

      try {
        await updateProfile(db, data);
        return c.json({ message: "Profile created" }, STATUS.OK);
      } catch (error) {
        console.error(error);
        return c.json(
          { error: "Something went wrong" },
          STATUS.INTERNAL_SERVER_ERROR,
        );
      }
    },
  )
  .post(
    "/models",
    validator(
      "form",
      z.object({
        accountId: accountIdSchema,
        model: z
          .instanceof(File)
          .refine(
            (file) => file.size > 0 && file.size < 1024 * 1024,
            "Invalid file size",
          )
          .refine((file) => file.name.endsWith(".ply"), "Invalid file type"),
      }),
    ),
    async (c) => {
      const db = drizzle(c.env.DB);

      const { accountId, model } = c.req.valid("form");

      const account = await db.query.accounts.findFirst({
        where: eq(accounts.id, accountId),
        columns: { username: true },
      });

      if (!account) {
        return c.json({ error: "Account not found" }, STATUS.NOT_FOUND);
      }

      const { username } = account;

      console.log("Size: ", model.size);

      try {
        await c.env.BUCKET.put(username, model.stream());
      } catch (error) {
        console.error(error);
        return c.json(
          { error: "Failed to upload model file to R2." },
          STATUS.INTERNAL_SERVER_ERROR,
        );
      }

      return c.json({ message: "Model updated successfully" });
    },
  )
  .get(
    "/models/:username",
    validator("param", z.object({ username: usernameSchema })),
    async (c) => {
      const { username } = c.req.valid("param");

      const file = await c.env.BUCKET.get(username);

      if (!file) {
        return c.json({ error: "Model not found" }, STATUS.NOT_FOUND);
      }

      c.header("Content-Type", "model/ply");
      c.header("Content-Length", String(file.size));
      c.header("ETag", file.httpEtag);
      return c.newResponse(file.body);
    },
  );
