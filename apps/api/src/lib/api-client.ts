import { hc } from "hono/client";

import app from "..";

// assign the client to a variable to calculate the type when compiling
const client = hc<typeof app>("");
export type Client = typeof client;
