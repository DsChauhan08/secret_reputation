import React, { useRef, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { Screen, GradientButton } from "../../src/components";
import { colors, gradients, typography, spacing, radii, SCREEN_WIDTH } from "../../src/theme";
import { useGameStore } from "../../src/store";

export default function ResultScreen() {
  const router = useRouter();
  const room = useGameStore((s) => s.room);
  const results = room?.results ?? [];
  const latestResult = results[results.length - 1];
  const viewShotRef = useRef<ViewShot>(null);

  const handleShare = useCallback(async () => {
    if (!viewShotRef.current?.capture) return;
    try {
      const uri = await viewShotRef.current.capture();
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share your result",
        });
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  }, []);

  if (!latestResult) return null;

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[typography.small, { color: colors.textMuted, letterSpacing: 2 }]}>
            RESULT CARD
          </Text>
        </Animated.View>
      </View>

      {/* Capturable Share Card (9:16) */}
      <Animated.View entering={FadeIn.duration(600).delay(200)} style={styles.cardWrapper}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1 }}
        >
          <View style={styles.shareCard}>
            <LinearGradient
              colors={["#14141A", "#0B0B0F"]}
              style={StyleSheet.absoluteFill}
            />

            {/* Top accent line */}
            <LinearGradient
              colors={[latestResult.winnerColor, `${latestResult.winnerColor}00`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topLine}
            />

            <View style={styles.cardContent}>
              {/* Category */}
              <Text style={styles.cardCategory}>
                {latestResult.categoryText}
              </Text>

              {/* Divider */}
              <View style={styles.cardDivider} />

              {/* Winner */}
              <View style={[styles.cardAvatar, { backgroundColor: latestResult.winnerColor }]}>
                <Text style={styles.cardAvatarText}>
                  {latestResult.winnerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.cardWinnerName}>
                {latestResult.winnerName}
              </Text>
              <Text style={styles.cardVotes}>
                {latestResult.winnerVotes} vote{latestResult.winnerVotes !== 1 ? "s" : ""} out of {latestResult.totalVotes}
              </Text>

              {/* Commentary */}
              <Text style={styles.cardCommentary}>
                {latestResult.commentary}
              </Text>

              {/* Watermark */}
              <View style={styles.watermark}>
                <Text style={styles.watermarkText}>SECRET REPUTATION</Text>
              </View>
            </View>
          </View>
        </ViewShot>
      </Animated.View>

      {/* Buttons */}
      <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.footer}>
        <GradientButton
          title="SHARE"
          onPress={handleShare}
          gradient={gradients.primary}
        />
        <View style={{ height: spacing.sm }} />
        <GradientButton
          title="BACK"
          onPress={() => router.back()}
          gradient={gradients.dark}
          size="md"
        />
      </Animated.View>
    </Screen>
  );
}

const CARD_WIDTH = SCREEN_WIDTH - spacing.xl * 4;
const CARD_HEIGHT = CARD_WIDTH * (16 / 9);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: spacing.massive,
  },
  header: {
    alignSelf: "flex-start",
    marginBottom: spacing.xl,
  },
  cardWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  shareCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  topLine: {
    height: 3,
    width: "100%",
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
  },
  cardCategory: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  cardDivider: {
    width: 30,
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginVertical: spacing.xxl,
  },
  cardAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  cardAvatarText: {
    color: "#0B0B0F",
    fontSize: 28,
    fontWeight: "800",
  },
  cardWinnerName: {
    ...typography.h1,
    textAlign: "center",
  },
  cardVotes: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  cardCommentary: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  watermark: {
    position: "absolute",
    bottom: spacing.xxl,
  },
  watermarkText: {
    ...typography.small,
    color: colors.textGhost,
    letterSpacing: 4,
    fontSize: 10,
  },
  footer: {
    width: "100%",
    paddingBottom: spacing.xxxl,
  },
});
