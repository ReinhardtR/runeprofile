import "@/styles/globals.css";
import { SearchModal } from "@/components/SearchModal";
import Head from "next/head";
import { withTRPC } from "@trpc/next";
import { AppRouter } from "@/server/routers";
import { AppType } from "next/dist/shared/lib/utils";
import superjson from "superjson";
import { loggerLink } from "@trpc/client/links/loggerLink";
import { httpBatchLink } from "@trpc/client/links/httpBatchLink";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <div className="bg-background-light text-white">
      <Head>
        <title>RuneProfile</title>
      </Head>
      <SearchModal />
      <>
        <Header />
        <Component {...pageProps} />
        <Footer />
      </>
    </div>
  );
};

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  }

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url

  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

export default withTRPC<AppRouter>({
  config({ ctx }) {
    /**
     * If you want to use SSR, you need to use the server's full URL
     * @link https://trpc.io/docs/ssr
     */
    const url = `${getBaseUrl()}/api/trpc`;

    return {
      url,
      transformer: superjson,
      /**
       * @link https://react-query.tanstack.com/reference/QueryClient
       */
      // queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
      /**
       * @link https://trpc.io/docs/links
       */
      links: [
        // adds pretty logs to your console in development and logs errors in production
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: false,
})(MyApp);
