import { Stack } from "expo-router";
import { colors } from "../../src/theme";

export default function RoomLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "fade",
      }}
    />
  );
}
