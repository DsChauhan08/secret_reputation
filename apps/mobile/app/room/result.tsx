import React, { useMemo, useRef } from "react";
import {
  Alert,
  Share as RNShare,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import { Screen, SoftButton } from "../../src/components";
import {
  colors,
  radii,
  SCREEN_WIDTH,
  shadow,
  spacing,
  typography,
} from "../../src/theme";
import { useGameStore } from "../../src/store";
import { buildShareMessage, getRoomInviteUrl } from "../../src/inviteLinks";

export default function ResultScreen() {
  const router = useRouter();
  const room = useGameStore((state) => state.room);
  const playerId = useGameStore((state) => state.playerId);
  const playerName = useGameStore((state) => state.playerName);
  const viewShotRef = useRef<ViewShot>(null);

  const latestResult = room?.results?.[room.results.length - 1];
  const isTie = Boolean(latestResult?.isTie);
  const tiedNames = latestResult?.tiedPlayerNames ?? [];
  const ownVoteCount = useMemo(() => {
    if (!latestResult || !playerId) return null;
    return latestResult.voteCounts.find((voteCount) => voteCount.playerId === playerId)?.count ?? 0;
  }, [latestResult, playerId]);

  if (!room || !latestResult) return null;

  const cardWidth = Math.min(SCREEN_WIDTH - spacing.xl * 2, 460);
  const headline = isTie
    ? "tie-break drama"
    : ownVoteCount && ownVoteCount > 0
      ? "you got called out"
      : "you survived this one";

  const handleShare = async () => {
    const shareMessage = buildShareMessage(room.code);
    const inviteUrl = getRoomInviteUrl(room.code);

    let imageUri: string | null = null;

    try {
      if (viewShotRef.current?.capture) {
        imageUri = await viewShotRef.current.capture();

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(imageUri, {
            dialogTitle: "Share to stories",
            mimeType: "image/png",
            UTI: "public.png",
          });
        } else {
          await RNShare.share({ message: shareMessage });
        }
        return;
      }

      await RNShare.share({ message: shareMessage, url: inviteUrl });
    } catch {
      Alert.alert("Share failed", "Could not share this card right now.");
    }
  };

  return (
    <Screen>
      <View style={styles.contentCenter}>
        <ViewShot
          ref={viewShotRef}
          options={{
            format: "png",
            quality: 1,
            result: "tmpfile",
          }}
        >
          <LinearGradient
            colors={isTie ? ["#1B1B2F", "#2E1065", "#831843", "#6D28D9"] : ["#09090F", "#16162A", "#2A1C4A", "#4C1D95"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.shareCard, { width: cardWidth }]}
          >
            <View style={styles.badgeRow}>
              <Text style={styles.brandBadge}>SECRET REPUTATION</Text>
              <Text style={styles.roundBadge}>ROUND {room.currentRound + 1}</Text>
            </View>

            <Text style={styles.heroTitle}>{headline}</Text>
            <Text style={styles.heroQuestion}>{latestResult.categoryText}</Text>

            {isTie && (
              <View style={styles.tieBanner}>
                <Text style={styles.tieBadge}>TIE-BREAK</Text>
                <Text style={styles.tieText}>
                  {tiedNames.slice(0, 3).join(" vs ")} tied at {latestResult.tieVoteCount ?? latestResult.winnerVotes} votes
                </Text>
              </View>
            )}

            <View style={styles.votePillRow}>
              <View style={[styles.votePill, { borderColor: `${latestResult.winnerColor}66` }]}> 
                <Text style={styles.votePillLabel}>{isTie ? "TIE-BREAK WINNER" : "TOP PICK"}</Text>
                <View style={styles.voteWinnerRow}>
                  <View
                    style={[
                      styles.winnerAvatar,
                      { backgroundColor: latestResult.winnerColor },
                    ]}
                  >
                    <Text style={styles.winnerAvatarText}>
                      {latestResult.winnerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.winnerName}>{latestResult.winnerName}</Text>
                    <Text style={styles.voteMeta}>
                      {latestResult.winnerVotes}/{latestResult.totalVotes} votes
                    </Text>
                    {isTie && (
                      <Text style={styles.tieSubMeta}>won after tie with {tiedNames.length} players</Text>
                    )}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <LinearGradient
                colors={["rgba(236,72,153,0.25)", "rgba(124,58,237,0.18)"]}
                style={styles.metricCard}
              >
                <Text style={styles.metricNumber}>{ownVoteCount ?? 0}</Text>
                <Text style={styles.metricLabel}>votes on {playerName || "you"}</Text>
              </LinearGradient>

              <LinearGradient
                colors={["rgba(59,130,246,0.24)", "rgba(30,64,175,0.16)"]}
                style={styles.metricCard}
              >
                <Text style={styles.metricNumber}>{room.players.length}</Text>
                <Text style={styles.metricLabel}>players in room</Text>
              </LinearGradient>
            </View>

            <Text style={styles.commentary}>
              “{latestResult.commentary}”
            </Text>

            <View style={styles.sparklineRow}>
              {latestResult.voteCounts.slice(0, 6).map((voteCount) => (
                <View key={voteCount.playerId} style={styles.sparkItem}>
                  <Text style={styles.sparkName}>{voteCount.playerName.slice(0, 5).toUpperCase()}</Text>
                  <View style={[styles.sparkBarTrack]}>
                    <View
                      style={[
                        styles.sparkBar,
                        {
                          width: `${latestResult.totalVotes > 0 ? Math.max(8, (voteCount.count / latestResult.totalVotes) * 100) : 8}%`,
                          backgroundColor: voteCount.playerColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.sparkCount}>{voteCount.count}</Text>
                </View>
              ))}
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerCode}>{room.code}</Text>
              <Text style={styles.footerCta}>JOIN THE ROOM</Text>
            </View>
          </LinearGradient>
        </ViewShot>
      </View>

      <View style={{ paddingBottom: spacing.xxxl }}>
        <SoftButton title="Share to Stories" onPress={handleShare} haptic="success" />
        <View style={{ height: spacing.md }} />
        <SoftButton
          title="Back"
          onPress={() => router.back()}
          variant="outline"
          haptic="light"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contentCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  shareCard: {
    borderRadius: radii.xl,
    padding: spacing.xxl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    ...shadow.lg,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandBadge: {
    color: "#C4B5FD",
    letterSpacing: 1.4,
    fontSize: 11,
    fontWeight: "700",
  },
  roundBadge: {
    color: "#F9A8D4",
    letterSpacing: 1.1,
    fontSize: 11,
    fontWeight: "700",
  },
  heroTitle: {
    ...typography.h1,
    color: "#FFFFFF",
    marginTop: spacing.xl,
    textTransform: "uppercase",
    fontSize: 30,
    letterSpacing: 0.4,
  },
  heroQuestion: {
    ...typography.h3,
    color: "#E2E8F0",
    marginTop: spacing.sm,
    lineHeight: 28,
  },
  votePillRow: {
    marginTop: spacing.xxl,
  },
  votePill: {
    borderWidth: 1,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: spacing.lg,
  },
  votePillLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#C4B5FD",
  },
  voteWinnerRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  winnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  winnerAvatarText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
  },
  winnerName: {
    ...typography.bodyBold,
    color: "#FFFFFF",
    fontSize: 19,
  },
  voteMeta: {
    ...typography.caption,
    color: "#CBD5E1",
    marginTop: 2,
  },
  tieSubMeta: {
    ...typography.small,
    color: "#FBCFE8",
    marginTop: 2,
  },
  tieBanner: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.45)",
    borderRadius: 14,
    backgroundColor: "rgba(251,191,36,0.14)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  tieBadge: {
    color: "#FDE68A",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  tieText: {
    ...typography.caption,
    color: "#FEF3C7",
  },
  statsRow: {
    marginTop: spacing.xl,
    flexDirection: "row",
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  metricNumber: {
    ...typography.h1,
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 34,
  },
  metricLabel: {
    ...typography.small,
    color: "#CBD5E1",
    textAlign: "center",
    marginTop: spacing.xs,
    fontSize: 12,
  },
  commentary: {
    ...typography.body,
    color: "#E2E8F0",
    marginTop: spacing.xxl,
    fontStyle: "italic",
    lineHeight: 24,
  },
  sparklineRow: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  sparkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sparkName: {
    width: 52,
    color: "#C4B5FD",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  sparkBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    overflow: "hidden",
  },
  sparkBar: {
    height: 8,
    borderRadius: 999,
  },
  sparkCount: {
    width: 20,
    textAlign: "right",
    color: "#E2E8F0",
    fontWeight: "700",
    fontSize: 12,
  },
  footerRow: {
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.16)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerCode: {
    color: "#FDE68A",
    fontWeight: "800",
    letterSpacing: 2.5,
    fontSize: 18,
  },
  footerCta: {
    color: "#C4B5FD",
    fontSize: 11,
    letterSpacing: 1.3,
    fontWeight: "700",
  },
});
