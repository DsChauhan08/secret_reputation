import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn, FadeInRight } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Screen, GradientButton, GlassCard } from "../../src/components";
import { colors, gradients, typography, spacing, radii } from "../../src/theme";
import { useGameStore } from "../../src/store";
import { wsClient } from "../../src/ws";

export default function EndScreen() {
  const router = useRouter();
  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);
  const reset = useGameStore((s) => s.reset);
  const isHost = room?.hostId === playerId;
  const results = room?.results ?? [];

  // Find player who won the most categories
  const winCounts: Record<string, { name: string; color: string; count: number }> = {};
  results.forEach((r) => {
    if (!winCounts[r.winnerId]) {
      winCounts[r.winnerId] = { name: r.winnerName, color: r.winnerColor, count: 0 };
    }
    winCounts[r.winnerId].count++;
  });
  const hallOfShame = Object.entries(winCounts)
    .sort(([, a], [, b]) => b.count - a.count)[0];

  const handlePlayAgain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    wsClient.send({ type: "PLAY_AGAIN", payload: {} });
    router.replace("/room/categories");
  };

  const handleNewRoom = () => {
    wsClient.disconnect();
    reset();
    router.replace("/");
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Text style={[typography.h1, { letterSpacing: 4, textAlign: "center" }]}>
            GAME OVER
          </Text>
          <Text style={[typography.caption, { textAlign: "center", marginTop: spacing.sm }]}>
            the room has spoken. here is the damage.
          </Text>
        </Animated.View>

        {/* Hall of Shame */}
        {hallOfShame && (
          <Animated.View entering={FadeInDown.duration(500).delay(300)}>
            <GlassCard style={styles.shameCard}>
              <Text style={[typography.small, { color: colors.textMuted, letterSpacing: 2, textAlign: "center" }]}>
                HALL OF SHAME
              </Text>
              <View style={styles.shameRow}>
                <View style={[styles.shameAvatar, { backgroundColor: hallOfShame[1].color }]}>
                  <Text style={styles.shameAvatarText}>
                    {hallOfShame[1].name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ marginLeft: spacing.md }}>
                  <Text style={typography.h3}>{hallOfShame[1].name}</Text>
                  <Text style={[typography.small, { color: colors.danger }]}>
                    won {hallOfShame[1].count} categor{hallOfShame[1].count === 1 ? "y" : "ies"}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        )}
      </View>

      {/* Results List */}
      <FlatList
        data={results}
        keyExtractor={(r, i) => `${r.categoryId}_${i}`}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: spacing.huge }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInRight.duration(300).delay(500 + index * 80)}>
            <View style={styles.resultRow}>
              <View style={styles.resultLeft}>
                <Text style={[typography.small, { color: colors.textMuted }]}>
                  {index + 1}.
                </Text>
              </View>
              <View style={styles.resultCenter}>
                <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.categoryText}
                </Text>
                <View style={styles.resultWinner}>
                  <View style={[styles.resultDot, { backgroundColor: item.winnerColor }]} />
                  <Text style={[typography.bodyBold, { marginLeft: spacing.sm }]}>
                    {item.winnerName}
                  </Text>
                  <Text style={[typography.small, { color: colors.textMuted, marginLeft: spacing.sm }]}>
                    {item.winnerVotes}v
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      />

      {/* Footer */}
      <Animated.View entering={FadeInDown.duration(400).delay(800)} style={styles.footer}>
        {isHost && (
          <GradientButton
            title="PLAY AGAIN"
            onPress={handlePlayAgain}
            gradient={gradients.primary}
          />
        )}
        <View style={{ height: spacing.sm }} />
        <GradientButton
          title="NEW ROOM"
          onPress={handleNewRoom}
          gradient={gradients.dark}
          size="md"
        />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.massive,
  },
  shameCard: {
    marginTop: spacing.xxl,
    alignItems: "center",
  },
  shameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  shameAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  shameAvatarText: {
    color: "#0B0B0F",
    fontSize: 20,
    fontWeight: "800",
  },
  list: {
    flex: 1,
    marginTop: spacing.xxl,
  },
  resultRow: {
    flexDirection: "row",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  resultLeft: {
    width: 30,
    justifyContent: "center",
  },
  resultCenter: {
    flex: 1,
  },
  resultWinner: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  resultDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  footer: {
    paddingBottom: spacing.xxxl,
  },
});
