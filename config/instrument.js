// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: "https://de13d54251667dab1347c81d5950a8ad@o4508324813471744.ingest.de.sentry.io/4508324818190416",
  integrations: [nodeProfilingIntegration()],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
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
