import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://c398f7a93a9a888b45cd1a91aa57374a@o4507023456993280.ingest.us.sentry.io/4507023458500608",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // ...

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
});
