import React from "react";
import { Share as RNShare, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen, SoftButton, Card } from "../../src/components";
import { colors, spacing, typography } from "../../src/theme";
import { useGameStore } from "../../src/store";
import { buildShareMessage } from "../../src/inviteLinks";

export default function ResultScreen() {
  const router = useRouter();
  const room = useGameStore((state) => state.room);
  const playerId = useGameStore((state) => state.playerId);
  const playerName = useGameStore((state) => state.playerName);

  const latestResult = room?.results?.[room.results.length - 1];
  if (!room || !latestResult) return null;

  const ownVoteCount = latestResult.voteCounts.find((voteCount) => voteCount.playerId === playerId)?.count ?? 0;
  const tiedNames = latestResult.tiedPlayerNames ?? [];
  const isTie = Boolean(latestResult.isTie);

  const headline = isTie
    ? "Tie-break drama"
    : ownVoteCount > 0
      ? "You got called out"
      : "You survived this one";

  const handleShare = async () => {
    const shareMessage = [
      headline,
      latestResult.categoryText,
      `${latestResult.winnerName} won with ${latestResult.winnerVotes}/${latestResult.totalVotes} votes`,
      isTie ? `Tie-break used: ${tiedNames.join(" vs ")}` : null,
      buildShareMessage(room.code),
    ]
      .filter(Boolean)
      .join("\n\n");

    await RNShare.share({ message: shareMessage });
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Card style={styles.card}>
          <Text style={styles.kicker}>RESULT</Text>
          <Text style={styles.headline}>{headline}</Text>

          <Text style={styles.category}>{latestResult.categoryText}</Text>

          <View style={styles.winnerRow}>
            <View style={[styles.dot, { backgroundColor: latestResult.winnerColor }]} />
            <Text style={styles.winnerName}>{latestResult.winnerName}</Text>
            <Text style={styles.votes}>{latestResult.winnerVotes}/{latestResult.totalVotes}</Text>
          </View>

          {isTie && (
            <View style={styles.tieBox}>
              <Text style={styles.tieTitle}>Tie-break used</Text>
              <Text style={styles.tieText}>{tiedNames.join(" vs ")}</Text>
            </View>
          )}

          {latestResult.isChaosRound && (
            <View style={styles.chaosChip}>
              <Text style={styles.chaosText}>Chaos card round</Text>
            </View>
          )}

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Votes on {playerName || "you"}</Text>
            <Text style={styles.statValue}>{ownVoteCount}</Text>
          </View>

          <Text style={styles.commentary}>“{latestResult.commentary}”</Text>
          <Text style={styles.roomCode}>Room {room.code}</Text>
        </Card>
      </View>

      <View style={{ paddingBottom: spacing.xxxl }}>
        <SoftButton title="Share" onPress={handleShare} haptic="success" />
        <View style={{ height: spacing.md }} />
        <SoftButton title="Back" onPress={() => router.back()} variant="outline" haptic="light" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  kicker: {
    ...typography.small,
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  headline: {
    ...typography.h1,
  },
  category: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  winnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  winnerName: {
    ...typography.bodyBold,
    flex: 1,
  },
  votes: {
    ...typography.caption,
    color: colors.textMuted,
  },
  tieBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FBBF24",
    backgroundColor: "#FFF7E6",
    padding: spacing.sm,
    gap: spacing.xs,
  },
  tieTitle: {
    ...typography.small,
    color: "#92400E",
    fontWeight: "700",
  },
  tieText: {
    ...typography.caption,
    color: "#78350F",
  },
  chaosChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  chaosText: {
    ...typography.small,
    color: "#991B1B",
    fontWeight: "700",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    ...typography.caption,
  },
  statValue: {
    ...typography.bodyBold,
  },
  commentary: {
    ...typography.body,
    fontStyle: "italic",
    color: colors.textSecondary,
  },
  roomCode: {
    ...typography.small,
    color: colors.primary,
    fontWeight: "700",
  },
});
