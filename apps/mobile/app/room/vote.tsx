import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Screen, PlayerChip, GlassCard, ProgressRing } from "../../src/components";
import { colors, typography, spacing } from "../../src/theme";
import { useGameStore } from "../../src/store";
import { wsClient } from "../../src/ws";

export default function VoteScreen() {
  const router = useRouter();
  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  // Get current category
  const currentCategory = room?.categories.find(
    (c) => c.id === room.selectedCategoryIds[room.currentRound]
  );

  // Navigate on status change
  useEffect(() => {
    if (room?.status === "revealing") {
      router.replace("/room/reveal");
    }
  }, [room?.status]);

  // Reset vote on new round
  useEffect(() => {
    setVotedFor(null);
    setLocked(false);
  }, [room?.currentRound]);

  // Waiting animation
  const waitPulse = useSharedValue(0.4);
  useEffect(() => {
    if (locked) {
      waitPulse.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [locked]);

  const waitStyle = useAnimatedStyle(() => ({
    opacity: waitPulse.value,
  }));

  const handleVote = (targetId: string) => {
    if (locked || targetId === playerId) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setVotedFor(targetId);
    setLocked(true);

    wsClient.send({
      type: "SUBMIT_VOTE",
      payload: {
        categoryId: currentCategory?.id ?? "",
        votedForId: targetId,
      },
    });
  };

  if (!room || !currentCategory) return null;

  const otherPlayers = room.players.filter((p) => p.id !== playerId);

  return (
    <Screen>
      <View style={styles.header}>
        {/* Round indicator */}
        <Animated.View entering={FadeIn.duration(300)}>
          <Text style={styles.roundText}>
            {room.currentRound + 1} OF {room.selectedCategoryIds.length}
          </Text>
        </Animated.View>

        {/* Category */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Text style={styles.categoryText}>
            {currentCategory.text}
          </Text>
        </Animated.View>

        {/* Divider */}
        <View style={styles.divider} />
      </View>

      {locked ? (
        /* Waiting state */
        <View style={styles.waitingContainer}>
          <Animated.View style={waitStyle}>
            <ProgressRing
              current={room.votesSubmitted}
              total={room.votesRequired}
              size={100}
            />
          </Animated.View>
          <Animated.View entering={FadeIn.duration(400)}>
            <Text style={styles.waitingText}>
              vote locked
            </Text>
            <Text style={[typography.small, { textAlign: "center", marginTop: spacing.sm }]}>
              waiting for everyone else
            </Text>
          </Animated.View>

          <GlassCard style={styles.voteConfirm}>
            <Text style={[typography.caption, { textAlign: "center", color: colors.textMuted }]}>
              you voted for {otherPlayers.find((p) => p.id === votedFor)?.name ?? "someone"}
            </Text>
          </GlassCard>
        </View>
      ) : (
        /* Voting state */
        <>
          <Animated.View entering={FadeIn.duration(300).delay(400)}>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
              tap to vote — you cannot vote for yourself
            </Text>
          </Animated.View>

          <FlatList
            data={otherPlayers}
            keyExtractor={(p) => p.id}
            style={styles.list}
            contentContainerStyle={{ paddingBottom: spacing.huge }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View style={{ marginBottom: spacing.sm }}>
                <PlayerChip
                  name={item.name}
                  color={item.color}
                  selected={votedFor === item.id}
                  onPress={() => handleVote(item.id)}
                  size="lg"
                  entering={FadeInDown.duration(200).delay(400 + index * 60)}
                />
              </View>
            )}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.massive,
  },
  roundText: {
    ...typography.small,
    color: colors.textMuted,
    letterSpacing: 3,
    textAlign: "center",
  },
  categoryText: {
    ...typography.h2,
    textAlign: "center",
    marginTop: spacing.xl,
    lineHeight: 32,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: colors.surfaceBorder,
    alignSelf: "center",
    marginVertical: spacing.xxl,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xxl,
  },
  waitingText: {
    ...typography.bodyBold,
    color: colors.accent,
    textAlign: "center",
    letterSpacing: 2,
  },
  voteConfirm: {
    marginTop: spacing.lg,
    alignSelf: "center",
  },
  list: {
    flex: 1,
  },
});
