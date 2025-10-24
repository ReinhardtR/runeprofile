import { eq } from "drizzle-orm";
import { cache } from "hono/cache";
import { z } from "zod";

import { accounts, drizzle } from "@runeprofile/db";
import { AccountTypes, ValuableDropEventSchema } from "@runeprofile/runescape";

import { sendActivityMessages } from "~/discord/messages";
import { addActivities } from "~/lib/activity-log/add-activities";
import { checkActivityEvents } from "~/lib/activity-log/check-activity-events";
import { getCollectionLogPage } from "~/lib/collection-log/get-collection-log-page";
import {
  RuneProfileAccountNotFoundError,
  RuneProfileFailedToDeleteFileError,
  RuneProfileFailedToUploadFileError,
  RuneProfileFileNotFoundError,
} from "~/lib/errors";
import { newRouter, r2FileToBase64 } from "~/lib/helpers";
import { deleteProfile } from "~/lib/profiles/delete-profile";
import { getProfileByUsername } from "~/lib/profiles/get-profile";
import { getProfileUpdates } from "~/lib/profiles/get-profile-updates";
import { searchProfiles } from "~/lib/profiles/search-profiles";
import { setDefaultClogPage } from "~/lib/profiles/set-default-clog-page";
import { updateProfile } from "~/lib/profiles/update-profile";
import { STATUS } from "~/lib/status";
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
    cache({
      cacheName: "profile",
      cacheControl: "public, max-age=0, s-maxage=60",
    }),
    async (c) => {
      const db = drizzle(c.env.DB);
      const { username } = c.req.valid("param");

      const profile = await getProfileByUsername(db, username);

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
    cache({
      cacheName: "clog-page",
      cacheControl: "public, max-age=0, s-maxage=10",
    }),
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
        clan: z
          .object({
            name: z.string(),
            rank: z.number(),
            icon: z.number(),
            title: z.string(),
          })
          .optional(),
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
        const updates = await getProfileUpdates(db, data);
        const activities = checkActivityEvents(updates);
        await updateProfile(db, updates, activities);

        if (activities.length > 0) {
          c.executionCtx.waitUntil(
            sendActivityMessages({
              db,
              discordToken: c.env.DISCORD_TOKEN,
              activities,
              accountId: data.id,
              rsn: data.username,
              accountType: AccountTypes[data.accountType],
              clanName: data.clan?.name,
            }),
          );
        }
      } catch (error) {
        console.log("Data: ", data);
        throw error;
      }

      return c.json({ message: "Profile updated" }, STATUS.OK);
    },
  )
  .post(
    "/set-default-clog-page",
    validator(
      "json",
      z.object({
        id: accountIdSchema,
        page: z.string(),
      }),
    ),
    async (c) => {
      const db = drizzle(c.env.DB);
      const { id, page } = c.req.valid("json");

      await setDefaultClogPage(db, {
        id,
        page,
      });

      return c.json({
        message: "Default collection log page set successfully",
      });
    },
  )
  .post(
    "/activities",
    validator(
      "json",
      z.object({
        id: accountIdSchema,
        activities: z.array(ValuableDropEventSchema), // currently only allow ValuableDropEventSchema
      }),
    ),
    async (c) => {
      const db = drizzle(c.env.DB);
      const { id, activities } = c.req.valid("json");

      await addActivities(db, {
        accountId: id,
        activities,
      });

      return c.json({ message: "Activities added successfully" });
    },
  )
  .delete(
    "/:id",
    validator("param", z.object({ id: accountIdSchema })),
    async (c) => {
      const db = drizzle(c.env.DB);
      const { id } = c.req.valid("param");

      const account = await deleteProfile(db, id);

      try {
        await c.env.BUCKET.delete(account.username);
        await c.env.BUCKET.delete(`${account.username}-pet`);
      } catch (error) {
        throw RuneProfileFailedToDeleteFileError;
      }

      return c.json({ message: "Profile deleted successfully" });
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

      const username = account.username.toLowerCase();

      try {
        await c.env.BUCKET.put(username, model.stream());
      } catch (error) {
        throw RuneProfileFailedToUploadFileError;
      }

      if (petModel) {
        try {
          await c.env.BUCKET.put(`${username}-pet`, petModel.stream());
        } catch (error) {
          throw RuneProfileFailedToUploadFileError;
        }
      } else {
        try {
          await c.env.BUCKET.delete(`${username}-pet`);
        } catch (error) {
          throw RuneProfileFailedToDeleteFileError;
        }
      }

      return c.json({ message: "Model updated successfully" });
    },
  )
  .get(
    "/models/:username",
    validator(
      "param",
      z.object({ username: usernameSchema.transform((v) => v.toLowerCase()) }),
    ),
    validator("query", z.object({ pet: z.coerce.boolean() })),
    cache({
      cacheName: "profile-model",
      cacheControl: "public, max-age=0, s-maxage=60",
    }),
    async (c) => {
      const { username } = c.req.valid("param");
      const { pet: includePet } = c.req.valid("query");

      const [playerFile, petFile] = await Promise.all([
        c.env.BUCKET.get(username),
        includePet
          ? c.env.BUCKET.get(`${username}-pet`)
          : Promise.resolve(null),
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
