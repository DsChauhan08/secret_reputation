import React, { useEffect, useMemo } from "react";
import { Stack, useGlobalSearchParams, useNavigationContainerRef, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PostHogProvider, PostHogSurveyProvider } from "posthog-react-native";
import * as Sentry from "@sentry/react-native";
import { colors } from "../src/theme";
import { AppErrorBoundary } from "../src/ErrorBoundary";
import { analytics, trackError } from "../src/analytics";

function normalizeSearchParams(params: Record<string, string | string[] | undefined>): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(params)) {
    if (Array.isArray(rawValue)) {
      normalized[key] = rawValue.join(",");
      continue;
    }

    if (typeof rawValue === "string") {
      normalized[key] = rawValue;
    }
  }

  return normalized;
}

function RootLayout() {
  const pathname = usePathname();
  const searchParams = useGlobalSearchParams();
  const navigationRef = useNavigationContainerRef();

  const screenProperties = useMemo(
    () => normalizeSearchParams(searchParams),
    [searchParams],
  );

  useEffect(() => {
    if (!analytics.posthogClient || !pathname) return;

    try {
      analytics.posthogClient.screen(pathname, screenProperties);
    } catch (error) {
      trackError(error, {
        scope: "screen_tracking",
        pathname,
      });
    }
  }, [pathname, screenProperties]);

  useEffect(() => {
    if (!analytics.sentryEnabled || !navigationRef) return;
    analytics.sentryNavigationIntegration.registerNavigationContainer(navigationRef);
  }, [navigationRef]);

  const appTree = (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <StatusBar style="dark" backgroundColor={colors.bg} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: "slide_from_right",
            }}
          />
        </View>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );

  if (!analytics.posthogClient) {
    return appTree;
  }

  return (
    <PostHogProvider
      client={analytics.posthogClient}
      autocapture={{
        captureScreens: false,
        captureTouches: false,
      }}
    >
      <PostHogSurveyProvider client={analytics.posthogClient}>{appTree}</PostHogSurveyProvider>
    </PostHogProvider>
  );
}

const WrappedRootLayout = analytics.sentryEnabled ? Sentry.wrap(RootLayout) : RootLayout;

export default WrappedRootLayout;
