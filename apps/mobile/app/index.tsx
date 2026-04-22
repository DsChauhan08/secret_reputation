import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Screen, SoftButton } from "../src/components";
import { colors, typography, spacing } from "../src/theme";
import { trackEvent } from "../src/analytics";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <Screen style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Secret</Text>
        <Text style={styles.titleAccent}>Reputation</Text>

        <View style={styles.divider} />

        <Text style={styles.description}>
          vote anonymously on who fits each category.{"\n"}
          results are revealed live.{"\n"}
          nobody knows who voted.
        </Text>
      </View>

      <View style={styles.buttons}>
        <SoftButton
          title="Start a Room"
          onPress={() => {
            trackEvent("home_cta_clicked", {
              cta: "start_room",
              source_screen: "home",
            });
            router.push("/create");
          }}
          color={colors.primary}
        />
        <View style={{ height: spacing.md }} />
        <SoftButton
          title="Join a Room"
          onPress={() => {
            trackEvent("home_cta_clicked", {
              cta: "join_room",
              source_screen: "home",
            });
            router.push("/join");
          }}
          variant="outline"
          color={colors.primary}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    ...typography.display,
    fontSize: 42,
    textAlign: "center",
    color: colors.text,
  },
  titleAccent: {
    ...typography.display,
    fontSize: 28,
    textAlign: "center",
    color: colors.primary,
    marginTop: spacing.xs,
    letterSpacing: 4,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: colors.divider,
    alignSelf: "center",
    marginVertical: spacing.xxl,
  },
  description: {
    ...typography.caption,
    textAlign: "center",
    lineHeight: 22,
    color: colors.textMuted,
  },
  buttons: {
    paddingBottom: spacing.huge,
  },
});
