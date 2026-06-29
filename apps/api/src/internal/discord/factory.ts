import { createFactory, createRest } from "discord-hono";

export const factory: ReturnType<typeof createFactory<{ Bindings: Env }>> =
  createFactory<{ Bindings: Env }>();

export const createDiscordApi = (token: string) => createRest(token);
