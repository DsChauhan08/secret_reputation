import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Share, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Screen, SoftButton, PlayerChip, Card } from "../../src/components";
import { colors, typography, spacing } from "../../src/theme";
import { useGameStore } from "../../src/store";
import { buildShareMessage } from "../../src/inviteLinks";

export default function LobbyScreen() {
  const router = useRouter();
  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);

  const isHost = room?.hostId === playerId;
  const canStart = (room?.players.length ?? 0) >= 3;

  useEffect(() => {
    if (room?.status === "voting") router.replace("/room/vote");
  }, [room?.status, router]);

  const handleShare = async () => {
    if (!room) return;
    try {
      await Share.share({
        message: buildShareMessage(room.code),
        title: "Join my Secret Reputation room",
      });
    } catch {}
  };

  const handleStart = () => {
    if (!isHost) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push("/room/categories");
  };

  if (!room) return null;

  const modeColors: Record<string, string> = {
    "light-roast": "#845EC2",
    "normal-chaos": "#4B4453",
    "unhinged": "#C34A36",
  };

  return (
    <Screen>
      <View style={{ paddingTop: spacing.lg }}>
        <Text style={[typography.small, { color: colors.textMuted, letterSpacing: 1.5 }]}>ROOM</Text>
        <Text style={[typography.h2, { marginTop: spacing.xs }]}>{room.name}</Text>

        <Pressable onPress={handleShare}>
          <Card style={styles.codeCard}>
            <Text style={[typography.small, { color: colors.textMuted, textAlign: "center", letterSpacing: 1.5 }]}>ROOM CODE</Text>
            <Text style={styles.codeText}>{room.code}</Text>
            <Text style={[typography.small, { color: colors.primary, textAlign: "center", marginTop: spacing.xs }]}>tap to share</Text>
          </Card>
        </Pressable>

        <View style={styles.modeBadge}>
          <View style={[styles.modeDot, { backgroundColor: modeColors[room.mode] ?? colors.primary }]} />
          <Text style={[typography.small, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
            {room.mode.replace("-", " ")}
          </Text>
        </View>
      </View>

      <View style={styles.countRow}>
        <Text style={typography.bodyBold}>{room.players.length} player{room.players.length !== 1 ? "s" : ""}</Text>
        <View style={styles.liveDot} />
        <Text style={[typography.small, { color: colors.textMuted }]}>waiting</Text>
      </View>

      <FlatList
        data={room.players}
        keyExtractor={(p) => p.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.huge }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ marginBottom: spacing.sm }}>
            <PlayerChip name={item.name} color={item.color} isHost={item.id === room.hostId} />
          </View>
        )}
      />

      <View style={{ paddingBottom: spacing.xxxl }}>
        {isHost ? (
          <SoftButton
            title={canStart ? "Choose Categories" : `Need ${3 - room.players.length} more`}
            onPress={handleStart}
            disabled={!canStart}
          />
        ) : (
          <Text style={[typography.caption, { textAlign: "center", color: colors.textMuted }]}>
            waiting for host to start
          </Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  codeCard: { marginTop: spacing.xl, alignItems: "center", paddingVertical: spacing.xl },
  codeText: { fontSize: 32, fontWeight: "800", color: colors.text, letterSpacing: 8, marginTop: spacing.sm },
  modeBadge: { flexDirection: "row", alignItems: "center", alignSelf: "center", marginTop: spacing.lg },
  modeDot: { width: 8, height: 8, borderRadius: 4 },
  countRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xxl, marginBottom: spacing.lg },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#00C9A7" },
});
