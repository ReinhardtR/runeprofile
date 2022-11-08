import { NextApiRequest } from "next";
import https from "https";
import http from "http";
import { env } from "@/server/env";

export const startRevalidateTask = async (
  nextReq: NextApiRequest,
  accountHash: string,
  extraPaths: string[] = [] // prefixed with /u/
) => {
  // create url from nextReq
  const host = nextReq.headers.host;

  if (!host) throw new Error("No host");

  const isLocalhost = host?.includes("localhost");
  const scheme = isLocalhost ? "http" : "https";

  const url = new URL(`/api/profile/revalidate-task`, `${scheme}://${host}`);

  const httpModule = scheme == "http" ? http : https;

  return new Promise((resolve) => {
    const request = httpModule.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    request.write(
      JSON.stringify({
        accountHash,
        secretToken: env.SECRET_TOKEN,
        extraPaths,
      })
    );

    request.end(() => {
      resolve(request);
    });
  });
};
