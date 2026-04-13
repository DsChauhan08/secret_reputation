import React, { useRef } from "react";
import { View, Text, StyleSheet, Share as RNShare } from "react-native";
import { useRouter } from "expo-router";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { Screen, SoftButton, Card } from "../../src/components";
import { colors, typography, spacing, radii, shadow, SCREEN_WIDTH } from "../../src/theme";
import { useGameStore } from "../../src/store";

export default function ResultScreen() {
  const router = useRouter();
  const room = useGameStore((s) => s.room);
  const viewShotRef = useRef<ViewShot>(null);

  const latestResult = room?.results?.[room.results.length - 1];
  if (!room || !latestResult) return null;

  const handleShare = async () => {
    try {
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        }
      }
    } catch {
      await RNShare.share({ message: `${latestResult.winnerName} won "${latestResult.categoryText}" in Secret Reputation!` });
    }
  };

  const cardWidth = SCREEN_WIDTH - spacing.xl * 2;

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
          <View style={[styles.shareCard, { width: cardWidth }]}>
            <View style={[styles.accentBar, { backgroundColor: latestResult.winnerColor }]} />

            <Text style={[typography.small, { color: colors.textMuted, letterSpacing: 1.5, textAlign: "center" }]}>
              SECRET REPUTATION
            </Text>

            <Text style={[typography.h2, { textAlign: "center", marginTop: spacing.xl }]}>
              {latestResult.categoryText}
            </Text>

            <View style={[styles.winnerAvatar, { backgroundColor: latestResult.winnerColor, marginTop: spacing.xxl }]}>
              <Text style={styles.winnerAvatarText}>{latestResult.winnerName.charAt(0).toUpperCase()}</Text>
            </View>

            <Text style={[typography.h1, { textAlign: "center", marginTop: spacing.lg }]}>
              {latestResult.winnerName}
            </Text>

            <Text style={[typography.caption, { textAlign: "center", marginTop: spacing.sm, color: colors.textMuted }]}>
              {latestResult.winnerVotes} of {latestResult.totalVotes} votes
            </Text>

            <Text style={[typography.caption, { textAlign: "center", marginTop: spacing.xl, fontStyle: "italic", color: colors.textSecondary }]}>
              "{latestResult.commentary}"
            </Text>

            {latestResult.voteCounts.slice(0, 5).map((vc) => (
              <View key={vc.playerId} style={styles.statRow}>
                <View style={[styles.statDot, { backgroundColor: vc.playerColor }]} />
                <Text style={[typography.caption, { flex: 1 }]}>{vc.playerName}</Text>
                <Text style={[typography.bodyBold, { fontSize: 14 }]}>{vc.count}</Text>
              </View>
            ))}
          </View>
        </ViewShot>
      </View>

      <View style={{ paddingBottom: spacing.xxxl }}>
        <SoftButton title="Share" onPress={handleShare} />
        <View style={{ height: spacing.md }} />
        <SoftButton title="Back" onPress={() => router.back()} variant="outline" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shareCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    ...shadow.lg,
  },
  accentBar: { height: 4, width: 40, borderRadius: 2, alignSelf: "center", marginBottom: spacing.lg },
  winnerAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  winnerAvatarText: { color: "#FFF", fontSize: 24, fontWeight: "800" },
  statRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.md },
  statDot: { width: 10, height: 10, borderRadius: 5 },
});
