import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Share, Pressable } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Screen, GradientButton, PlayerChip, GlassCard } from "../../src/components";
import { colors, gradients, typography, spacing, radii } from "../../src/theme";
import { useGameStore } from "../../src/store";

export default function LobbyScreen() {
  const router = useRouter();
  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);

  const isHost = room?.hostId === playerId;
  const canStart = (room?.players.length ?? 0) >= 3;

  // Pulse animation for waiting state
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // Navigate to categories when host starts
  useEffect(() => {
    if (room?.status === "voting") {
      router.replace("/room/vote");
    }
  }, [room?.status]);

  const handleShare = async () => {
    if (!room) return;
    try {
      await Share.share({
        message: `Join my Secret Reputation room!\n\nRoom code: ${room.code}\n\nDownload the app and enter the code to join.`,
      });
    } catch {}
  };

  const handleStart = () => {
    if (!isHost) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push("/room/categories");
  };

  if (!room) return null;

  return (
    <Screen>
      <View style={styles.header}>
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={[typography.small, { color: colors.textMuted, letterSpacing: 2 }]}>
            ROOM
          </Text>
          <Text style={[typography.h2, { marginTop: spacing.xs }]}>
            {room.name}
          </Text>
        </Animated.View>

        {/* Room Code */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Pressable onPress={handleShare}>
            <GlassCard style={styles.codeCard}>
              <Text style={[typography.small, { color: colors.textMuted, letterSpacing: 2, textAlign: "center" }]}>
                ROOM CODE
              </Text>
              <Text style={styles.codeText}>{room.code}</Text>
              <Text style={[typography.small, { color: colors.primary, textAlign: "center", marginTop: spacing.xs }]}>
                TAP TO SHARE
              </Text>
            </GlassCard>
          </Pressable>
        </Animated.View>

        {/* Room Mode Badge */}
        <Animated.View entering={FadeIn.duration(400).delay(300)} style={styles.modeBadge}>
          <View style={[styles.modeDot, {
            backgroundColor: room.mode === "light-roast" ? "#F59E0B"
              : room.mode === "unhinged" ? "#F43F5E" : "#8B5CF6"
          }]} />
          <Text style={[typography.small, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
            {room.mode.toUpperCase().replace("-", " ")}
          </Text>
        </Animated.View>
      </View>

      {/* Player Count */}
      <Animated.View entering={FadeIn.duration(400).delay(400)} style={styles.countRow}>
        <Text style={[typography.bodyBold]}>
          {room.players.length} player{room.players.length !== 1 ? "s" : ""}
        </Text>
        <Animated.View style={pulseStyle}>
          <View style={styles.liveDot} />
        </Animated.View>
        <Text style={[typography.small, { color: colors.textMuted }]}>
          waiting for players
        </Text>
      </Animated.View>

      {/* Player List */}
      <FlatList
        data={room.players}
        keyExtractor={(p) => p.id}
        style={styles.playerList}
        contentContainerStyle={{ paddingBottom: spacing.huge }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={{ marginBottom: spacing.sm }}>
            <PlayerChip
              name={item.name}
              color={item.color}
              isHost={item.id === room.hostId}
              entering={FadeInRight.duration(300).delay(index * 80)}
            />
          </View>
        )}
      />

      {/* Footer */}
      <View style={styles.footer}>
        {isHost ? (
          <GradientButton
            title={canStart ? "CHOOSE CATEGORIES" : `NEED ${3 - room.players.length} MORE`}
            onPress={handleStart}
            disabled={!canStart}
            gradient={canStart ? gradients.primary : gradients.dark}
          />
        ) : (
          <Animated.View style={pulseStyle}>
            <Text style={[typography.caption, { textAlign: "center", color: colors.textMuted }]}>
              waiting for host to start the game
            </Text>
          </Animated.View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.massive,
  },
  codeCard: {
    marginTop: spacing.xl,
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  codeText: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 10,
    marginTop: spacing.sm,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginTop: spacing.lg,
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  playerList: {
    flex: 1,
  },
  footer: {
    paddingBottom: spacing.xxxl,
  },
});
