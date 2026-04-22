import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const plugins: NonNullable<ExpoConfig["plugins"]> = [
    "expo-router",
    [
      "expo-build-properties",
      {
        android: {
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          buildArchs: ["arm64-v8a"],
        },
      },
    ],
  ];

  const sentryOrg = process.env.SENTRY_ORG;
  const sentryProject = process.env.SENTRY_PROJECT;
  if (sentryOrg && sentryProject) {
    plugins.push([
      "@sentry/react-native/expo",
      {
        organization: sentryOrg,
        project: sentryProject,
        url: process.env.SENTRY_URL || "https://sentry.io/",
      },
    ]);
  }

  return {
    ...config,
    name: "Secret Reputation",
    slug: "secret-reputation",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "secretrep",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#FAFAFA",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.secretreputation.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FAFAFA",
      },
      edgeToEdgeEnabled: true,
      package: "com.secretreputation.app",
      versionCode: 1,
    },
    plugins,
    extra: {
      wsUrl: process.env.EXPO_PUBLIC_WS_URL || "",
      posthogApiKey: process.env.EXPO_PUBLIC_POSTHOG_KEY || "",
      posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || "",
      appEnv: process.env.EXPO_PUBLIC_APP_ENV || (process.env.NODE_ENV ?? "development"),
      eas: {
        projectId: "7d7d87e4-bbee-4cdd-b321-f4d3b6a6c19f",
      },
    },
  };
};
