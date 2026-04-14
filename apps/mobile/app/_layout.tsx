import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "../src/theme";
import { AppErrorBoundary } from "../src/ErrorBoundary";

export default function RootLayout() {
  return (
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
}
