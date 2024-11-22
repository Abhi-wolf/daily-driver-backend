import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const SENTRY_DSN = process.env.SENTRY_DSN;

if (!SENTRY_DSN) {
  console.warn("Sentry DSN is not set. Errors will not be tracked.");
}

Sentry.init({
  dsn: SENTRY_DSN || null,
  integrations: [nodeProfilingIntegration()],
  registerEsmLoaderHooks: {
    onlyIncludeInstrumentedModules: true,
  },
  tracesSampleRate: 1.0,
});

Sentry.profiler.startProfiler();

Sentry.startSpan(
  {
    name: "My First Transaction",
  },
  () => {
    // the code executing inside the transaction will be wrapped in a span and profiled
  }
);

Sentry.profiler.stopProfiler();
