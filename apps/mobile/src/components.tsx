import React from "react";
import {
  Text,
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import type { ViewStyle, TextStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors, spacing, radii, typography, shadow, PLAYER_COLORS } from "./theme";

type HapticKind = "none" | "light" | "selection" | "success";

function triggerHaptic(kind: HapticKind): void {
  if (kind === "none") return;

  if (kind === "selection") {
    void Haptics.selectionAsync().catch(() => {});
    return;
  }

  if (kind === "success") {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    return;
  }

  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}


interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Screen({ children, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}


interface SoftButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: "filled" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
  haptic?: HapticKind;
}

export function SoftButton({
  title,
  onPress,
  color = colors.primary,
  textColor,
  disabled = false,
  loading = false,
  variant = "filled",
  size = "lg",
  style,
  haptic = "none",
}: SoftButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    triggerHaptic(haptic);
    onPress();
  };

  const heights: Record<string, number> = { sm: 40, md: 44, lg: 50 };
  const fontSizes: Record<string, number> = { sm: 14, md: 15, lg: 16 };

  const bgColor =
    variant === "filled"
      ? disabled ? colors.divider : color
      : "transparent";

  const borderColor =
    variant === "outline"
      ? disabled ? colors.divider : color
      : "transparent";

  const labelColor =
    textColor ??
    (variant === "filled"
      ? "#FFFFFF"
      : disabled ? colors.textMuted : color);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.softBtn,
        {
          height: heights[size],
          backgroundColor: pressed && !disabled
            ? variant === "filled" ? `${color}DD` : colors.overlay
            : bgColor,
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderColor,
        },
        variant === "filled" && !disabled && shadow.sm,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <Text
          style={[
            styles.softBtnText,
            {
              fontSize: fontSizes[size],
              color: labelColor,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}


interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}


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
      placeholderTextColor={colors.textPlaceholder}
      maxLength={maxLength}
      autoCapitalize={autoCapitalize}
      autoFocus={autoFocus}
      selectionColor={colors.primary}
      style={[styles.input, style, textStyle]}
    />
  );
}


interface PlayerChipProps {
  name: string;
  color: string;
  isHost?: boolean;
  selected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md" | "lg";
  haptic?: HapticKind;
}

export function PlayerChip({
  name,
  color,
  isHost = false,
  selected = false,
  onPress,
  size = "md",
  haptic = "none",
}: PlayerChipProps) {
  const sizes: Record<string, { avatar: number; font: number; pad: number }> = {
    sm: { avatar: 30, font: 13, pad: spacing.sm },
    md: { avatar: 38, font: 14, pad: spacing.md },
    lg: { avatar: 48, font: 16, pad: spacing.lg },
  };

  const s = sizes[size];

  return (
    <Pressable
      onPress={() => {
        if (!onPress) return;
        triggerHaptic(haptic);
        onPress();
      }}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.playerChip,
        {
          paddingHorizontal: s.pad,
          paddingVertical: s.pad,
          borderColor: selected ? color : colors.cardBorder,
          backgroundColor: pressed ? colors.overlay : selected ? `${color}10` : colors.card,
        },
        shadow.sm,
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
      <View style={{ marginLeft: spacing.md, flex: 1 }}>
        <Text style={{ fontSize: s.font, fontWeight: "600", color: colors.text }} numberOfLines={1}>
          {name}
        </Text>
        {isHost && (
          <Text style={[typography.small, { color: colors.primary }]}>HOST</Text>
        )}
      </View>
      {selected && (
        <View style={[styles.checkMark, { backgroundColor: color }]}>
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 11 }}>OK</Text>
        </View>
      )}
    </Pressable>
  );
}


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
            triggerHaptic("selection");
            onSelect(c);
          }}
          style={[
            styles.colorDot,
            {
              backgroundColor: c,
              borderWidth: selected === c ? 3 : 0,
              borderColor: colors.text,
              transform: [{ scale: selected === c ? 1.15 : 1 }],
            },
          ]}
        />
      ))}
    </View>
  );
}


interface ModeCardProps {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  accentColor: string;
  haptic?: HapticKind;
}

export function ModeCard({ title, description, selected, onPress, accentColor, haptic = "light" }: ModeCardProps) {
  return (
    <Pressable
      onPress={() => {
        triggerHaptic(haptic);
        onPress();
      }}
      style={({ pressed }) => [
        styles.modeCard,
        {
          borderColor: selected ? accentColor : colors.cardBorder,
          backgroundColor: pressed ? colors.overlay : selected ? `${accentColor}15` : colors.card,
        },
        selected && shadow.sm,
      ]}
    >
      <View style={[styles.modeDot, { backgroundColor: accentColor }]} />
      <Text style={[typography.bodyBold, { marginTop: spacing.sm }]}>{title}</Text>
      <Text style={[typography.small, { marginTop: spacing.xs }]}>{description}</Text>
    </Pressable>
  );
}


interface CategoryCardProps {
  text: string;
  selected: boolean;
  onPress: () => void;
  haptic?: HapticKind;
}

export function CategoryCard({ text, selected, onPress, haptic = "selection" }: CategoryCardProps) {
  return (
    <Pressable
      onPress={() => {
        triggerHaptic(haptic);
        onPress();
      }}
      style={({ pressed }) => [
        styles.categoryCard,
        {
          borderColor: selected ? colors.primary : colors.cardBorder,
          backgroundColor: pressed ? colors.overlay : selected ? `${colors.primary}08` : colors.card,
        },
      ]}
    >
      <Text style={[typography.caption, { color: selected ? colors.text : colors.textSecondary }]}>
        {text}
      </Text>
    </Pressable>
  );
}


interface ProgressRingProps {
  current: number;
  total: number;
  size?: number;
}

export function ProgressRing({ current, total, size = 80 }: ProgressRingProps) {
  return (
    <View style={[styles.progressRing, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[typography.h3, { color: colors.primary }]}>
        {current}/{total}
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
  },

  softBtn: {
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  softBtnText: {
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    ...shadow.sm,
  },

  input: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    height: 50,
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
    color: "#FFFFFF",
    fontWeight: "700",
  },
  checkMark: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
    width: 34,
    height: 34,
    borderRadius: 17,
  },

  modeCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    flex: 1,
  },
  modeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
    borderWidth: 3,
    borderColor: colors.primary,
  },
});
