import "@/styles/globals.css";
import { SearchModal } from "@/components/SearchModal";
import Head from "next/head";
import { type AppType } from "next/dist/shared/lib/utils";
import { Analytics } from "@vercel/analytics/react";
import { trpc } from "../utils/trpc";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <div className="bg-background text-white">
        <Head>
          <title>RuneProfile</title>
        </Head>
        <SearchModal />

        <Component {...pageProps} />
      </div>
      <Analytics />
    </>
  );
};

export default trpc.withTRPC(MyApp);
