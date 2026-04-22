import Constants from "expo-constants";
import PostHog from "posthog-react-native";
import * as Sentry from "@sentry/react-native";

type AppExtra = {
  posthogApiKey?: string;
  posthogHost?: string;
  sentryDsn?: string;
  appEnv?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

const posthogApiKey = typeof extra.posthogApiKey === "string" ? extra.posthogApiKey : "";
const posthogHost = typeof extra.posthogHost === "string" ? extra.posthogHost : "https://us.i.posthog.com";
const sentryDsn = typeof extra.sentryDsn === "string" ? extra.sentryDsn : "";
const appEnvironment = typeof extra.appEnv === "string" ? extra.appEnv : "development";
const appVersion = Constants.expoConfig?.version ?? "0.0.0";

const posthogEnabled = posthogApiKey.length > 0;
const sentryEnabled = sentryDsn.length > 0;

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

if (sentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    enabled: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    environment: appEnvironment,
    release: `secret-reputation-mobile@${appVersion}`,
    integrations: [navigationIntegration],
    sendDefaultPii: false,
    debug: false,
  });
}

const posthogClient = posthogEnabled
  ? new PostHog(posthogApiKey, {
      host: posthogHost,
      captureAppLifecycleEvents: true,
      enableSessionReplay: !__DEV__,
      sessionReplayConfig: {
        maskAllTextInputs: true,
        maskAllImages: true,
      },
    })
  : null;

function redact(input: string): string {
  if (!input) return "";
  if (input.length <= 8) return "***";
  return `${input.slice(0, 4)}...${input.slice(-4)}`;
}

export const analytics = {
  posthogClient,
  posthogEnabled,
  sentryEnabled,
  sentryNavigationIntegration: navigationIntegration,
  configSummary: {
    posthogHost,
    posthogKeyHint: redact(posthogApiKey),
    sentryDsnHint: redact(sentryDsn),
    appEnvironment,
  },
};

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (!posthogClient) return;
  posthogClient.capture(event, properties);
}

export function identifyUser(id: string, properties?: Record<string, unknown>): void {
  if (!id) return;

  if (posthogClient) {
    posthogClient.identify(id, properties);
  }

  if (sentryEnabled) {
    Sentry.setUser({ id });
  }
}

export function resetAnalyticsUser(): void {
  if (posthogClient) {
    posthogClient.reset();
  }

  if (sentryEnabled) {
    Sentry.setUser(null);
  }
}

export function trackError(error: unknown, context?: Record<string, unknown>): void {
  if (posthogClient) {
    posthogClient.captureException(error, context ?? {});
  }
  if (sentryEnabled) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}
