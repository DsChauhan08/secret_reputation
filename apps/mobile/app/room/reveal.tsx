import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Screen, GradientButton } from "../../src/components";
import { colors, gradients, typography, spacing, radii, SCREEN_WIDTH } from "../../src/theme";
import { useGameStore } from "../../src/store";
import { wsClient } from "../../src/ws";

type RevealPhase = "category" | "tension" | "winner" | "stats" | "commentary" | "done";

export default function RevealScreen() {
  const router = useRouter();
  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);
  const isHost = room?.hostId === playerId;

  const results = room?.results ?? [];
  const latestResult = results[results.length - 1];
  const hasMoreRounds = room ? room.currentRound < room.selectedCategoryIds.length - 1 : false;

  const [phase, setPhase] = useState<RevealPhase>("category");

  // Glow animation
  const glowScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0);

  // Shake animation for tension
  const shakeX = useSharedValue(0);

  // Winner card scale
  const winnerScale = useSharedValue(0);

  useEffect(() => {
    if (!latestResult) return;

    // Phase 1: Category appears (already visible)
    // Phase 2: Tension build at 1.5s
    const t1 = setTimeout(() => {
      setPhase("tension");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Shake effect
      shakeX.value = withSequence(
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(-2, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }, 1500);

    // Phase 3: Winner reveal at 3s
    const t2 = setTimeout(() => {
      setPhase("winner");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Glow burst
      glowOpacity.value = withSequence(
        withTiming(0.8, { duration: 200 }),
        withTiming(0.3, { duration: 1000 })
      );
      glowScale.value = withSequence(
        withTiming(1.2, { duration: 300 }),
        withSpring(1, { damping: 10 })
      );

      // Winner card entrance
      winnerScale.value = withSpring(1, {
        damping: 12,
        stiffness: 100,
      });
    }, 3000);

    // Phase 4: Vote count at 4.2s
    const t3 = setTimeout(() => {
      setPhase("stats");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 4200);

    // Phase 5: Commentary at 5.2s
    const t4 = setTimeout(() => {
      setPhase("commentary");
    }, 5200);

    // Phase 6: Controls at 6.5s
    const t5 = setTimeout(() => {
      setPhase("done");
    }, 6500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [latestResult?.categoryId]);

  // Listen for next round / game end
  useEffect(() => {
    if (room?.status === "voting") {
      setPhase("category");
      winnerScale.value = 0;
      glowOpacity.value = 0;
      router.replace("/room/vote");
    }
    if (room?.status === "ended") {
      router.replace("/room/end");
    }
  }, [room?.status]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const winnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: winnerScale.value }],
  }));

  const handleNext = () => {
    if (hasMoreRounds) {
      wsClient.send({ type: "NEXT_ROUND", payload: {} });
    } else {
      router.replace("/room/end");
    }
  };

  const handleViewCard = () => {
    router.push("/room/result");
  };

  if (!latestResult) return null;

  return (
    <Screen style={styles.container}>
      {/* Background glow */}
      <Animated.View style={[styles.bgGlow, glowStyle]}>
        <LinearGradient
          colors={[`${latestResult.winnerColor}40`, "transparent"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 0.5, y: 0.8 }}
        />
      </Animated.View>

      <Animated.View style={[styles.content, shakeStyle]}>
        {/* Category */}
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={styles.roundIndicator}>
            ROUND {(room?.currentRound ?? 0) + 1}
          </Text>
          <Text style={styles.categoryText}>
            {latestResult.categoryText}
          </Text>
        </Animated.View>

        {/* Tension dots */}
        {phase === "tension" && (
          <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
            <Text style={styles.tensionDots}>. . .</Text>
          </Animated.View>
        )}

        {/* Winner Card */}
        {(phase === "winner" || phase === "stats" || phase === "commentary" || phase === "done") && (
          <Animated.View style={[styles.winnerCard, winnerStyle]}>
            <LinearGradient
              colors={[`${latestResult.winnerColor}30`, `${latestResult.winnerColor}05`]}
              style={styles.winnerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Winner avatar */}
              <View style={[styles.winnerAvatar, { backgroundColor: latestResult.winnerColor }]}>
                <Text style={styles.winnerAvatarText}>
                  {latestResult.winnerName.charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Winner name */}
              <Text style={styles.winnerName}>
                {latestResult.winnerName}
              </Text>

              {/* Vote count */}
              {(phase === "stats" || phase === "commentary" || phase === "done") && (
                <Animated.View entering={FadeInUp.duration(400)}>
                  <Text style={styles.voteCount}>
                    {latestResult.winnerVotes} vote{latestResult.winnerVotes !== 1 ? "s" : ""}
                  </Text>
                </Animated.View>
              )}

              {/* Runner up */}
              {(phase === "stats" || phase === "commentary" || phase === "done") &&
                latestResult.runnerName && (
                  <Animated.View entering={FadeIn.duration(400).delay(200)}>
                    <Text style={styles.runnerText}>
                      runner-up: {latestResult.runnerName} ({latestResult.runnerVotes})
                    </Text>
                  </Animated.View>
                )}
            </LinearGradient>
          </Animated.View>
        )}

        {/* Commentary */}
        {(phase === "commentary" || phase === "done") && (
          <Animated.View entering={FadeInUp.duration(600)}>
            <Text style={styles.commentary}>
              {latestResult.commentary}
            </Text>
          </Animated.View>
        )}
      </Animated.View>

      {/* Controls */}
      {phase === "done" && (
        <Animated.View entering={FadeInUp.duration(400)} style={styles.footer}>
          <GradientButton
            title="VIEW CARD"
            onPress={handleViewCard}
            gradient={gradients.dark}
            size="md"
          />
          <View style={{ height: spacing.sm }} />
          {isHost && (
            <GradientButton
              title={hasMoreRounds ? "NEXT ROUND" : "SEE RESULTS"}
              onPress={handleNext}
              gradient={gradients.primary}
            />
          )}
          {!isHost && (
            <Text style={[typography.small, { textAlign: "center", color: colors.textMuted, marginTop: spacing.sm }]}>
              waiting for host to continue
            </Text>
          )}
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
  bgGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacing.massive,
  },
  roundIndicator: {
    ...typography.small,
    color: colors.textMuted,
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  categoryText: {
    ...typography.h1,
    textAlign: "center",
    lineHeight: 40,
    paddingHorizontal: spacing.lg,
  },
  tensionDots: {
    ...typography.display,
    color: colors.primary,
    textAlign: "center",
    marginTop: spacing.xxxl,
    letterSpacing: 8,
  },
  winnerCard: {
    marginTop: spacing.xxxl,
    width: SCREEN_WIDTH - spacing.xl * 2 - spacing.xl * 2,
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  winnerGradient: {
    padding: spacing.xxxl,
    alignItems: "center",
  },
  winnerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  winnerAvatarText: {
    color: "#0B0B0F",
    fontSize: 32,
    fontWeight: "800",
  },
  winnerName: {
    ...typography.display,
    fontSize: 28,
    textAlign: "center",
  },
  voteCount: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  runnerText: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  commentary: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xxxl,
    fontStyle: "italic",
    paddingHorizontal: spacing.xxl,
  },
  footer: {
    paddingBottom: spacing.xxxl,
  },
});
