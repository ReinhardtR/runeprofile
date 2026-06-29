import { z } from "zod";

const schema = z.object({
  CF_ACCOUNT_ID: z.string().min(1),
  D1_DATABASE_ID: z.string().min(1),
  CF_API_TOKEN: z.string().min(1),
  MODE: z.string().default("local"),
  API_URL: z.string().optional(),
  DISCORD_CHANNEL_ID: z.string().optional(),
});

let _env: z.infer<typeof schema> | null = null;
export function env() {
  if (_env) return _env;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success)
    throw new Error("Invalid admin env: " + parsed.error.message);
  _env = parsed.data;
  return _env;
}
export const isRemote = () => env().MODE === "remote";
