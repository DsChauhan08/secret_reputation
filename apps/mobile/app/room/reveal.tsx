import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Screen, SoftButton, Card } from "../../src/components";
import { colors, typography, spacing, radii, shadow } from "../../src/theme";
import { useGameStore } from "../../src/store";

type RevealPhase = "category" | "countdown" | "winner" | "commentary" | "stats" | "next";

export default function RevealScreen() {
  const router = useRouter();
  const room = useGameStore((s) => s.room);
  const [phase, setPhase] = useState<RevealPhase>("category");

  const latestResult = room?.results?.[room.results.length - 1];

  useEffect(() => {
    if (!latestResult) return;

    const timings: Record<RevealPhase, number> = {
      category: 2000,
      countdown: 1500,
      winner: 3000,
      commentary: 2500,
      stats: 3000,
      next: 0,
    };

    const sequence: RevealPhase[] = ["category", "countdown", "winner", "commentary", "stats", "next"];
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;

    const advance = () => {
      if (i >= sequence.length - 1) return;
      timer = setTimeout(() => {
        i++;
        setPhase(sequence[i]);
        if (sequence[i] === "winner") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        advance();
      }, timings[sequence[i]]);
    };

    setPhase("category");
    advance();
    return () => clearTimeout(timer);
  }, [latestResult?.categoryId]);

  useEffect(() => {
    if (room?.status === "voting") { setPhase("category"); router.replace("/room/vote"); }
    if (room?.status === "ended") router.replace("/room/end");
  }, [room?.status]);

  if (!room || !latestResult) return null;

  const handleNext = () => {
    const isHost = room.hostId === useGameStore.getState().playerId;
    if (isHost) {
      router.push("/room/result");
    }
  };

  return (
    <Screen style={styles.container}>
      {phase === "category" && (
        <Animated.View key="cat" entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={styles.center}>
          <Text style={[typography.small, { color: colors.textMuted, letterSpacing: 1.5 }]}>THE CATEGORY</Text>
          <Text style={[typography.h1, { marginTop: spacing.lg, textAlign: "center" }]}>{latestResult.categoryText}</Text>
        </Animated.View>
      )}

      {phase === "countdown" && (
        <Animated.View key="cd" entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.center}>
          <Text style={[typography.display, { color: colors.primary }]}>...</Text>
        </Animated.View>
      )}

      {phase === "winner" && (
        <Animated.View key="win" entering={FadeIn.duration(500)} exiting={FadeOut.duration(200)} style={styles.center}>
          <View style={[styles.winnerCard, { borderColor: latestResult.winnerColor }]}>
            <View style={[styles.winnerAvatar, { backgroundColor: latestResult.winnerColor }]}>
              <Text style={styles.winnerAvatarText}>{latestResult.winnerName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={[typography.h1, { marginTop: spacing.lg }]}>{latestResult.winnerName}</Text>
            <Text style={[typography.caption, { marginTop: spacing.sm, color: colors.textMuted }]}>
              {latestResult.winnerVotes} of {latestResult.totalVotes} votes
            </Text>
          </View>
        </Animated.View>
      )}

      {phase === "commentary" && (
        <Animated.View key="cmt" entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={styles.center}>
          <Text style={[typography.h3, { textAlign: "center", color: colors.textSecondary, fontStyle: "italic", lineHeight: 28 }]}>
            "{latestResult.commentary}"
          </Text>
        </Animated.View>
      )}

      {phase === "stats" && (
        <Animated.View key="stats" entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={styles.center}>
          <Text style={[typography.small, { color: colors.textMuted, letterSpacing: 1.5, marginBottom: spacing.lg }]}>VOTE BREAKDOWN</Text>
          {latestResult.voteCounts.map((vc) => (
            <View key={vc.playerId} style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: vc.playerColor }]} />
              <Text style={[typography.body, { flex: 1 }]}>{vc.playerName}</Text>
              <Text style={[typography.bodyBold, { color: vc.count > 0 ? colors.text : colors.textMuted }]}>{vc.count}</Text>
            </View>
          ))}
        </Animated.View>
      )}

      {phase === "next" && (
        <Animated.View key="next" entering={FadeIn.duration(300)} style={styles.footer}>
          <SoftButton title="View Result Card" onPress={handleNext} />
          <View style={{ height: spacing.md }} />
          <SoftButton title="Continue" onPress={() => {}} variant="outline" />
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.xl },
  winnerCard: {
    alignItems: "center",
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xxxl,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 2,
    ...shadow.lg,
  },
  winnerAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  winnerAvatarText: { color: "#FFF", fontSize: 28, fontWeight: "800" },
  statRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, width: "100%" },
  statDot: { width: 12, height: 12, borderRadius: 6 },
  footer: { paddingBottom: spacing.xxxl },
});
