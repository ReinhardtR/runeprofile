import { eq } from "drizzle-orm";
import { cache } from "hono/cache";
import { z } from "zod";

import { accounts, drizzle } from "~/db";
import {
  RuneProfileAccountNotFoundError,
  RuneProfileFailedToDeleteFileError,
  RuneProfileFailedToUploadFileError,
  RuneProfileFileNotFoundError,
} from "~/lib/errors";
import { getCollectionLogPage } from "~/lib/get-collection-log-page";
import { getProfile } from "~/lib/get-profile";
import { getProfileUpdates } from "~/lib/get-profile-updates";
import { newRouter, r2FileToBase64 } from "~/lib/helpers";
import { searchProfiles } from "~/lib/search-profiles";
import { STATUS } from "~/lib/status";
import { updateProfile } from "~/lib/update-profile";
import { accountIdSchema, usernameSchema, validator } from "~/lib/validation";

export const profilesRouter = newRouter()
  .get("/", validator("query", z.object({ q: z.string() })), async (c) => {
    const db = drizzle(c.env.DB);
    const { q } = c.req.valid("query");

    const profiles = await searchProfiles(db, q);

    return c.json(profiles, STATUS.OK);
  })
  .get(
    "/:username",
    validator("param", z.object({ username: usernameSchema })),
    cache({ cacheName: "profile", cacheControl: "max-age=60" }),
    async (c) => {
      const db = drizzle(c.env.DB);
      const { username } = c.req.valid("param");

      const profile = await getProfile(db, username);

      return c.json(profile, STATUS.OK);
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
      const collectionLogPage = await getCollectionLogPage(db, username, page);

      return c.json(collectionLogPage, STATUS.OK);
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

      await updateProfile(db, data);

      return c.json({ message: "Profile updated" }, STATUS.OK);
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
        petModel: z
          .instanceof(File)
          .refine(
            (file) => file.size > 0 && file.size < 1024 * 1024,
            "Invalid file size",
          )
          .refine((file) => file.name.endsWith(".ply"), "Invalid file type")
          .optional(),
      }),
    ),
    async (c) => {
      const db = drizzle(c.env.DB);

      const { accountId, model, petModel } = c.req.valid("form");

      const account = await db.query.accounts.findFirst({
        where: eq(accounts.id, accountId),
        columns: { username: true },
      });

      if (!account) {
        throw RuneProfileAccountNotFoundError;
      }

      try {
        await c.env.BUCKET.put(account.username, model.stream());
      } catch (error) {
        throw RuneProfileFailedToUploadFileError;
      }

      if (petModel) {
        try {
          await c.env.BUCKET.put(`${account.username}-pet`, petModel.stream());
        } catch (error) {
          throw RuneProfileFailedToUploadFileError;
        }
      } else {
        try {
          await c.env.BUCKET.delete(`${account.username}-pet`);
        } catch (error) {
          throw RuneProfileFailedToDeleteFileError;
        }
      }

      return c.json({ message: "Model updated successfully" });
    },
  )
  .get(
    "/models/:username",
    validator("param", z.object({ username: usernameSchema })),
    async (c) => {
      const { username } = c.req.valid("param");

      const [playerFile, petFile] = await Promise.all([
        c.env.BUCKET.get(username),
        c.env.BUCKET.get(`${username}-pet`),
      ]);

      if (!playerFile) {
        throw RuneProfileFileNotFoundError;
      }

      const [playerBase64, petBase64] = await Promise.all([
        r2FileToBase64(playerFile),
        petFile ? r2FileToBase64(petFile) : Promise.resolve(null),
      ]);

      return c.json({
        playerModelBase64: playerBase64,
        petModelBase64: petBase64,
      });
    },
  );
