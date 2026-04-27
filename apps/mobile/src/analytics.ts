import Constants from "expo-constants";
import PostHog from "posthog-react-native";

type EventProperties = Record<string, any>;

type AppExtra = {
  posthogApiKey?: string;
  posthogHost?: string;
  appEnv?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

const posthogApiKey = typeof extra.posthogApiKey === "string" ? extra.posthogApiKey : "";
const posthogHost = typeof extra.posthogHost === "string" ? extra.posthogHost : "https://us.i.posthog.com";
const appEnvironment = typeof extra.appEnv === "string" ? extra.appEnv : "development";

const posthogEnabled = posthogApiKey.length > 0;

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
  configSummary: {
    posthogHost,
    posthogKeyHint: redact(posthogApiKey),
    appEnvironment,
  },
};

export function trackEvent(event: string, properties?: EventProperties): void {
  if (!posthogClient) return;
  posthogClient.capture(event, properties);
}

export function identifyUser(id: string, properties?: EventProperties): void {
  if (!id) return;

  if (posthogClient) {
    posthogClient.identify(id, properties);
  }
}

export function resetAnalyticsUser(): void {
  if (posthogClient) {
    posthogClient.reset();
  }
}

export function trackError(error: unknown, context?: EventProperties): void {
  if (posthogClient) {
    posthogClient.captureException(error, context);
  }
}
