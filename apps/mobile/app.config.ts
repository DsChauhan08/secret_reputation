import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Secret Reputation",
  slug: "secret-reputation",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  scheme: "secretrep",
  newArchEnabled: true,
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
  },
  plugins: ["expo-router"],
  extra: {
    wsUrl: process.env.EXPO_PUBLIC_WS_URL || "",
    eas: {
      projectId: "7d7d87e4-bbee-4cdd-b321-f4d3b6a6c19f",
    },
  },
});
