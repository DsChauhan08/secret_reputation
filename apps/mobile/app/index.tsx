import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Screen, GradientButton } from "../src/components";
import { colors, gradients, typography, spacing } from "../src/theme";

export default function HomeScreen() {
  const router = useRouter();

  // Subtle glow pulse animation
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Screen style={styles.container}>
      {/* Background glow effect */}
      <Animated.View style={[styles.bgGlow, glowStyle]}>
        <LinearGradient
          colors={["#8B5CF620", "#06F5C110", "transparent"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
        />
      </Animated.View>

      <View style={styles.content}>
        {/* Title */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)}>
          <Text style={styles.title}>SECRET</Text>
          <Text style={styles.titleAccent}>REPUTATION</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View entering={FadeInDown.duration(600).delay(300)}>
          <Text style={styles.tagline}>
            the room always knows
          </Text>
        </Animated.View>

        {/* Divider */}
        <Animated.View
          entering={FadeIn.duration(800).delay(500)}
          style={styles.divider}
        />

        {/* Description */}
        <Animated.View entering={FadeInDown.duration(600).delay(500)}>
          <Text style={styles.description}>
            vote anonymously on who fits each category.{"\n"}
            the results are revealed live.{"\n"}
            nobody knows who voted.
          </Text>
        </Animated.View>
      </View>

      {/* Buttons */}
      <Animated.View
        entering={FadeInDown.duration(600).delay(700)}
        style={styles.buttons}
      >
        <GradientButton
          title="START A ROOM"
          onPress={() => router.push("/create")}
          gradient={gradients.primary}
        />
        <View style={{ height: spacing.md }} />
        <GradientButton
          title="JOIN A ROOM"
          onPress={() => router.push("/join")}
          gradient={gradients.dark}
        />
      </Animated.View>

      {/* Bottom accent line */}
      <Animated.View
        entering={FadeIn.duration(1000).delay(900)}
        style={styles.bottomLine}
      >
        <LinearGradient
          colors={[...gradients.reveal]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bottomLineGradient}
        />
      </Animated.View>
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
    height: "60%",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    ...typography.display,
    fontSize: 52,
    letterSpacing: 8,
    textAlign: "center",
    color: colors.text,
  },
  titleAccent: {
    ...typography.display,
    fontSize: 32,
    letterSpacing: 12,
    textAlign: "center",
    color: colors.primary,
    marginTop: spacing.xs,
  },
  tagline: {
    ...typography.caption,
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.xxl,
    letterSpacing: 2,
    textTransform: "lowercase",
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: colors.surfaceBorder,
    alignSelf: "center",
    marginVertical: spacing.xxl,
  },
  description: {
    ...typography.caption,
    textAlign: "center",
    lineHeight: 22,
    color: colors.textSecondary,
  },
  buttons: {
    paddingBottom: spacing.huge,
  },
  bottomLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bottomLineGradient: {
    height: 2,
    width: "60%",
    borderRadius: 1,
  },
});
