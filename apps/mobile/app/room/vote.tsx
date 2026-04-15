import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Screen, SoftButton, PlayerChip, ProgressRing, Card } from "../../src/components";
import { colors, typography, spacing } from "../../src/theme";
import { useGameStore } from "../../src/store";
import { wsClient } from "../../src/ws";

export default function VoteScreen() {
  const router = useRouter();
  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);

  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const currentCategory = room?.categories?.find(
    (c) => c.id === room.selectedCategoryIds?.[room.currentRound]
  );

  useEffect(() => {
    if (room?.status === "revealing") router.replace("/room/reveal");
    if (room?.status === "ended") router.replace("/room/end");
  }, [room?.status, router]);

  useEffect(() => {
    setVotedFor(null);
    setLocked(false);
  }, [room?.currentRound]);

  const handleVote = () => {
    if (!votedFor || locked || !currentCategory) return;
    wsClient.send({ type: "SUBMIT_VOTE", payload: { categoryId: currentCategory.id, votedForId: votedFor } });
    setLocked(true);
  };

  if (!room || !currentCategory) return null;

  const otherPlayers = room.players.filter((p) => p.id !== playerId && p.connected);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[typography.small, { color: colors.textMuted, letterSpacing: 1 }]}>
          ROUND {room.currentRound + 1} OF {room.totalRounds}
        </Text>
        <Card style={styles.categoryCard}>
          <Text style={[typography.h2, { textAlign: "center" }]}>
            {currentCategory.text}
          </Text>
        </Card>
      </View>

      {locked ? (
        <View style={styles.waiting}>
          <ProgressRing current={room.votesSubmitted} total={room.votesRequired} />
          <Text style={[typography.caption, { marginTop: spacing.lg, textAlign: "center" }]}>
            waiting for everyone
          </Text>
        </View>
      ) : (
        <>
          <Text style={[typography.caption, { marginTop: spacing.lg, marginBottom: spacing.md }]}>
            who fits this the most?
          </Text>
          <FlatList
            data={otherPlayers}
            keyExtractor={(p) => p.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: spacing.huge }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={{ marginBottom: spacing.sm }}>
                <PlayerChip
                  name={item.name}
                  color={item.color}
                  selected={votedFor === item.id}
                  onPress={() => setVotedFor(item.id)}
                />
              </View>
            )}
          />
        </>
      )}

      {!locked && (
        <View style={{ paddingBottom: spacing.xxxl }}>
          <SoftButton title="Lock In Vote" onPress={handleVote} disabled={!votedFor} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.xxl },
  categoryCard: { marginTop: spacing.lg, paddingVertical: spacing.xxl },
  waiting: { flex: 1, justifyContent: "center", alignItems: "center" },
});
