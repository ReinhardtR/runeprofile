import { NextApiRequest } from "next";
import https from "https";
import http from "http";
import { env } from "@/server/env";

export const startRevalidateTask = async (
  nextReq: NextApiRequest,
  accountHash: string,
  extraPaths: string[] = []
) => {
  // create url from nextReq
  const host = nextReq.headers.host;

  if (!host) throw new Error("No host");

  const isLocalhost = host?.includes("localhost");
  const scheme = isLocalhost ? "http" : "https";

  const url = new URL(`/api/profile/revalidate-task`, `${scheme}://${host}`);

  url.searchParams.set("accountHash", accountHash);
  url.searchParams.set("secretToken", env.SECRET_TOKEN);
  url.searchParams.set("extraPaths", JSON.stringify(extraPaths));

  const httpModule = scheme == "http" ? http : https;

  return new Promise((resolve) => {
    const request = httpModule.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    request.end(() => {
      resolve(request);
    });
  });
};
