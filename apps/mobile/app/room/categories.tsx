import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  Screen,
  GradientButton,
  CategoryCard,
  GlassCard,
  Input,
} from "../../src/components";
import { colors, gradients, typography, spacing, radii } from "../../src/theme";
import { useGameStore } from "../../src/store";
import { wsClient } from "../../src/ws";
import { getCategoriesByMode, isContentSafe } from "../../src/gamedata";
import type { Category } from "../../src/gamedata";
import type { RoomMode } from "../../src/store";

const MIN_CATEGORIES = 3;
const MAX_CATEGORIES = 12;

export default function CategoriesScreen() {
  const router = useRouter();
  const room = useGameStore((s) => s.room);

  const availableCategories = useMemo(() => {
    if (!room) return [];
    return getCategoriesByMode(room.mode);
  }, [room?.mode]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customText, setCustomText] = useState("");
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [customError, setCustomError] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);

  const allCategories = [...availableCategories, ...customCategories];
  const selectedCount = selected.size;
  const canStart = selectedCount >= MIN_CATEGORIES && selectedCount <= MAX_CATEGORIES;

  const toggleCategory = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= MAX_CATEGORIES) return;
      next.add(id);
    }
    setSelected(next);
  };

  const handleShuffle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const shuffled = [...allCategories].sort(() => Math.random() - 0.5);
    const pick = shuffled.slice(0, 8);
    setSelected(new Set(pick.map((c) => c.id)));
  };

  const handleAddCustom = () => {
    const text = customText.trim();
    if (!text) return;

    const check = isContentSafe(text);
    if (!check.safe) {
      setCustomError(check.reason ?? "not allowed");
      return;
    }

    const id = `custom_${Date.now()}`;
    const cat: Category = {
      id,
      text: text.toLowerCase(),
      mode: room?.mode ?? "normal-chaos",
      isCustom: true,
    };
    setCustomCategories((prev) => [...prev, cat]);
    setSelected((prev) => new Set([...prev, id]));
    setCustomText("");
    setCustomError(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleStart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    wsClient.send({
      type: "START_GAME",
      payload: { selectedCategoryIds: Array.from(selected) },
    });
    router.replace("/room/vote");
  };

  if (!room) return null;

  return (
    <Screen>
      <View style={styles.header}>
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>BACK</Text>
          </Pressable>
          <Text style={[typography.h1, { letterSpacing: 4, marginTop: spacing.lg }]}>
            CATEGORIES
          </Text>
          <Text style={[typography.caption, { marginTop: spacing.sm }]}>
            pick {MIN_CATEGORIES}-{MAX_CATEGORIES} categories for this round
          </Text>
        </Animated.View>

        {/* Counter + Shuffle */}
        <Animated.View entering={FadeIn.duration(400).delay(200)} style={styles.controls}>
          <View style={styles.counter}>
            <Text style={[typography.bodyBold, {
              color: canStart ? colors.accent : colors.textMuted
            }]}>
              {selectedCount}
            </Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>
              /{MAX_CATEGORIES}
            </Text>
          </View>

          <Pressable onPress={handleShuffle} style={styles.shuffleBtn}>
            <Text style={[typography.caption, { color: colors.primary }]}>
              SHUFFLE
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowCustom(!showCustom)}
            style={styles.shuffleBtn}
          >
            <Text style={[typography.caption, { color: colors.accent }]}>
              {showCustom ? "HIDE" : "CUSTOM"}
            </Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Custom Category Input */}
      {showCustom && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.customRow}>
          <View style={{ flex: 1 }}>
            <Input
              value={customText}
              onChangeText={(t) => {
                setCustomText(t);
                setCustomError(null);
              }}
              placeholder="most likely to..."
              maxLength={120}
            />
          </View>
          <Pressable onPress={handleAddCustom} style={styles.addBtn}>
            <Text style={styles.addBtnText}>ADD</Text>
          </Pressable>
        </Animated.View>
      )}
      {customError && (
        <Text style={styles.errorText}>{customError}</Text>
      )}

      {/* Category List */}
      <FlatList
        data={allCategories}
        keyExtractor={(c) => c.id}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: spacing.huge }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={{ marginBottom: spacing.sm }}>
            <CategoryCard
              text={item.text}
              selected={selected.has(item.id)}
              onPress={() => toggleCategory(item.id)}
              entering={index < 15 ? FadeInDown.duration(200).delay(index * 30) : undefined}
            />
          </View>
        )}
      />

      {/* Start Button */}
      <View style={styles.footer}>
        <GradientButton
          title={canStart ? `START VOTING (${selectedCount})` : `SELECT ${MIN_CATEGORIES - selectedCount} MORE`}
          onPress={handleStart}
          disabled={!canStart}
          gradient={canStart ? gradients.primary : gradients.dark}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.massive,
  },
  backText: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 2,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  counter: {
    flexDirection: "row",
    alignItems: "baseline",
    flex: 1,
  },
  shuffleBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  customRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 1,
  },
  errorText: {
    ...typography.small,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  list: {
    flex: 1,
  },
  footer: {
    paddingBottom: spacing.xxxl,
  },
});
