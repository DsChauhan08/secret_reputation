import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Share } from "react-native";
import { useRouter } from "expo-router";
import { Screen, SoftButton, Card } from "../../src/components";
import { colors, typography, spacing, radii, shadow } from "../../src/theme";
import { useGameStore } from "../../src/store";
import { wsClient } from "../../src/ws";
import type { RoundResult } from "../../src/store";
import { buildShareMessage } from "../../src/inviteLinks";
import { resetAnalyticsUser, trackError, trackEvent } from "../../src/analytics";

export default function EndScreen() {
  const router = useRouter();
  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);
  const reset = useGameStore((s) => s.reset);

  const isHost = room?.hostId === playerId;

  const shouldShowRematchInvite = useMemo(() => {
    if (!room || room.results.length < 3) return false;
    const seed = `${room.code}:${room.results.length}:${room.players.length}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return hash % 100 >= 45;
  }, [room?.code, room?.results.length, room?.players.length]);

  useEffect(() => {
    if (room?.status === "lobby") router.replace("/room/lobby");
  }, [room?.status, router]);

  if (!room) return null;

  const handlePlayAgain = () => {
    if (!isHost) return;
    wsClient.send({ type: "PLAY_AGAIN", payload: {} as Record<string, never> });
    trackEvent("play_again_requested", {
      rounds_played: room.results.length,
      player_count: room.players.length,
    });
  };

  const handleLeave = () => {
    trackEvent("room_left", {
      rounds_played: room.results.length,
      room_code: room.code,
    });
    wsClient.disconnect();
    router.push("/");
    reset();
    resetAnalyticsUser();
  };
  const handleInviteRematch = async () => {
    try {
      await Share.share({
        title: "Rematch?",
        message: `${buildShareMessage(room.code)}\n\nRematch in 10 seconds? 👀`,
      });
      trackEvent("rematch_invite_shared", {
        room_code: room.code,
      });
    } catch {
      trackError(new Error("rematch_invite_share_failed"), {
        room_code: room.code,
      });
    }
  };

  return (
    <Screen>
      <View style={{ paddingTop: spacing.xxl }}>
        <Text style={[typography.h1, { textAlign: "center" }]}>Game Over</Text>
        <Text style={[typography.caption, { textAlign: "center", marginTop: spacing.sm }]}>
          {room.results.length} rounds played
        </Text>
      </View>

      <FlatList
        data={room.results}
        keyExtractor={(r: RoundResult) => r.categoryId}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: spacing.xxl, paddingBottom: spacing.huge }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: RoundResult }) => (
          <Card style={styles.resultCard}>
            <Text style={[typography.caption, { color: colors.textMuted }]}>{item.categoryText}</Text>
            <View style={styles.winnerRow}>
              <View style={[styles.dot, { backgroundColor: item.winnerColor }]} />
              <Text style={[typography.bodyBold, { flex: 1 }]}>{item.winnerName}</Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>{item.winnerVotes}/{item.totalVotes}</Text>
            </View>
          </Card>
        )}
      />

      <View style={{ paddingBottom: spacing.xxxl }}>
        {isHost ? (
          <SoftButton title="Play Again" onPress={handlePlayAgain} />
        ) : (
          <SoftButton title="Waiting for host..." onPress={() => {}} disabled />
        )}
        <View style={{ height: spacing.md }} />
        {shouldShowRematchInvite && (
          <>
            <SoftButton title="Invite for rematch" onPress={handleInviteRematch} variant="outline" haptic="light" />
            <View style={{ height: spacing.md }} />
          </>
        )}
        <SoftButton title="Leave" onPress={handleLeave} variant="outline" color={colors.danger} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  resultCard: { marginBottom: spacing.md },
  winnerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
  dot: { width: 14, height: 14, borderRadius: 7 },
});
