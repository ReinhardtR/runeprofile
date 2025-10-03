import { factory } from "~/discord/factory";
import * as interactions from "~/discord/interactions";
import { newRouter } from "~/lib/helpers";

const discord = factory.discord().loader(Object.values(interactions));

export const discordRouter = newRouter();
discordRouter.mount("/", discord.fetch.bind(discord));
