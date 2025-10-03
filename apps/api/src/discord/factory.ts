import { createFactory, createRest } from "discord-hono";

export const factory = createFactory<{ Bindings: Env }>();

export const createDiscordApi = (env: Env) => createRest(env.DISCORD_TOKEN);
