import React from "react";
import {
  TouchableOpacity,
  Text,
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors, gradients, spacing, radii, typography, PLAYER_COLORS } from "./theme";

// ============================================================
// GRADIENT BUTTON
// ============================================================

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  gradient?: readonly [string, string];
  disabled?: boolean;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

export function GradientButton({
  title,
  onPress,
  gradient = gradients.primary,
  disabled = false,
  loading = false,
  size = "lg",
  style,
}: GradientButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const heights = { sm: 40, md: 48, lg: 56 };
  const fontSizes = { sm: 14, md: 16, lg: 18 };

  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
      >
        <LinearGradient
          colors={disabled ? [colors.surfaceLight, colors.surface] : [...gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientBtn,
            { height: heights[size] },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : (
            <Text
              style={[
                styles.gradientBtnText,
                {
                  fontSize: fontSizes[size],
                  color: disabled ? colors.textMuted : colors.text,
                },
              ]}
            >
              {title}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ============================================================
// GLASS CARD (opacity-based, no blur dependency)
// ============================================================

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  entering?: any;
}

export function GlassCard({ children, style, entering }: GlassCardProps) {
  return (
    <Animated.View
      entering={entering}
      style={[styles.glassCard, style]}
    >
      {children}
    </Animated.View>
  );
}

// ============================================================
// TEXT INPUT
// ============================================================

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  style?: ViewStyle;
  textStyle?: TextStyle;
  autoFocus?: boolean;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  maxLength,
  autoCapitalize = "none",
  style,
  textStyle,
  autoFocus = false,
}: InputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textGhost}
      maxLength={maxLength}
      autoCapitalize={autoCapitalize}
      autoFocus={autoFocus}
      selectionColor={colors.primary}
      style={[styles.input, style, textStyle]}
    />
  );
}

// ============================================================
// PLAYER CHIP
// ============================================================

interface PlayerChipProps {
  name: string;
  color: string;
  isHost?: boolean;
  selected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md" | "lg";
  entering?: any;
}

export function PlayerChip({
  name,
  color,
  isHost = false,
  selected = false,
  onPress,
  size = "md",
  entering,
}: PlayerChipProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (!onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withSpring(0.9, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    onPress();
  };

  const sizes = {
    sm: { avatar: 32, font: 12, pad: spacing.sm },
    md: { avatar: 40, font: 14, pad: spacing.md },
    lg: { avatar: 56, font: 16, pad: spacing.lg },
  };

  const s = sizes[size];

  return (
    <Animated.View entering={entering} style={animStyle}>
      <Pressable
        onPress={handlePress}
        disabled={!onPress}
        style={[
          styles.playerChip,
          {
            paddingHorizontal: s.pad,
            paddingVertical: s.pad - 2,
            borderColor: selected ? color : colors.surfaceBorder,
            backgroundColor: selected
              ? `${color}15`
              : colors.surface,
          },
        ]}
      >
        <View
          style={[
            styles.avatar,
            {
              width: s.avatar,
              height: s.avatar,
              backgroundColor: color,
              borderRadius: s.avatar / 2,
            },
          ]}
        >
          <Text style={[styles.avatarText, { fontSize: s.font }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
          <Text
            style={[
              { fontSize: s.font, fontWeight: "600", color: colors.text },
            ]}
            numberOfLines={1}
          >
            {name}
          </Text>
          {isHost && (
            <Text style={[typography.small, { color: colors.primary }]}>
              HOST
            </Text>
          )}
        </View>
        {selected && (
          <View style={[styles.checkMark, { backgroundColor: color }]}>
            <Text style={{ color: colors.bg, fontWeight: "700", fontSize: 12 }}>
              OK
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ============================================================
// COLOR PICKER
// ============================================================

interface ColorPickerProps {
  selected: string;
  onSelect: (color: string) => void;
}

export function ColorPicker({ selected, onSelect }: ColorPickerProps) {
  return (
    <View style={styles.colorPicker}>
      {PLAYER_COLORS.map((c) => (
        <Pressable
          key={c}
          onPress={() => {
            Haptics.selectionAsync();
            onSelect(c);
          }}
          style={[
            styles.colorDot,
            {
              backgroundColor: c,
              borderWidth: selected === c ? 3 : 0,
              borderColor: colors.text,
              transform: [{ scale: selected === c ? 1.2 : 1 }],
            },
          ]}
        />
      ))}
    </View>
  );
}

// ============================================================
// MODE CARD
// ============================================================

interface ModeCardProps {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  accentColor: string;
}

export function ModeCard({
  title,
  description,
  selected,
  onPress,
  accentColor,
}: ModeCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          scale.value = withSequence(
            withSpring(0.95, { damping: 15 }),
            withSpring(1, { damping: 15 })
          );
          onPress();
        }}
        style={[
          styles.modeCard,
          {
            borderColor: selected ? accentColor : colors.surfaceBorder,
            backgroundColor: selected ? `${accentColor}10` : colors.surface,
          },
        ]}
      >
        <View
          style={[
            styles.modeDot,
            { backgroundColor: accentColor },
          ]}
        />
        <Text style={[typography.bodyBold, { marginTop: spacing.sm }]}>
          {title}
        </Text>
        <Text style={[typography.small, { marginTop: spacing.xs }]}>
          {description}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ============================================================
// CATEGORY CARD
// ============================================================

interface CategoryCardProps {
  text: string;
  selected: boolean;
  onPress: () => void;
  entering?: any;
}

export function CategoryCard({ text, selected, onPress, entering }: CategoryCardProps) {
  return (
    <Animated.View entering={entering}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        style={[
          styles.categoryCard,
          {
            borderColor: selected ? colors.primary : colors.surfaceBorder,
            backgroundColor: selected ? `${colors.primary}15` : colors.surface,
          },
        ]}
      >
        <Text
          style={[
            typography.caption,
            {
              color: selected ? colors.text : colors.textSecondary,
            },
          ]}
        >
          {text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ============================================================
// PROGRESS RING (simple)
// ============================================================

interface ProgressRingProps {
  current: number;
  total: number;
  size?: number;
}

export function ProgressRing({ current, total, size = 80 }: ProgressRingProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <View
        style={[
          styles.progressRingInner,
          {
            width: size - 8,
            height: size - 8,
            borderRadius: (size - 8) / 2,
          },
        ]}
      >
        <Text style={[typography.h3, { color: colors.primary }]}>
          {current}/{total}
        </Text>
      </View>
      <View
        style={[
          styles.progressRingFill,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: colors.primary,
            borderTopColor: percentage >= 25 ? colors.primary : colors.surfaceBorder,
            borderRightColor: percentage >= 50 ? colors.primary : colors.surfaceBorder,
            borderBottomColor: percentage >= 75 ? colors.primary : colors.surfaceBorder,
            borderLeftColor: percentage >= 100 ? colors.primary : colors.surfaceBorder,
          },
        ]}
      />
    </View>
  );
}

// ============================================================
// SCREEN WRAPPER
// ============================================================

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Screen({ children, style }: ScreenProps) {
  return (
    <View style={[styles.screen, style]}>
      {children}
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
  },

  gradientBtn: {
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  gradientBtnText: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  glassCard: {
    backgroundColor: `${colors.surfaceLight}90`,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
  },

  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    height: 52,
  },

  playerChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.bg,
    fontWeight: "800",
  },
  checkMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "center",
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  modeCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    flex: 1,
  },
  modeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  categoryCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  progressRing: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  progressRingInner: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    position: "absolute",
    zIndex: 1,
  },
  progressRingFill: {
    borderWidth: 4,
    position: "absolute",
  },
});
