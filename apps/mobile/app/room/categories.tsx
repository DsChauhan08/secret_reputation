import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Screen, SoftButton, CategoryCard, Input } from "../../src/components";
import { colors, typography, spacing, radii } from "../../src/theme";
import { useGameStore } from "../../src/store";
import { wsClient } from "../../src/ws";
import {
  addStoredCustomQuestion,
  fetchServerQuestions,
  listStoredCustomQuestions,
  saveQuestionToServer,
  type StoredCustomQuestion,
} from "../../src/customQuestions";
import {
  getCategoriesByMode,
  getRandomCategories,
  normalizeCategoryText,
  type Category,
  type RoomMode,
} from "@secret-reputation/shared";

const MIN_CATEGORIES = 10;

export default function CategoriesScreen() {
  const router = useRouter();
  const room = useGameStore((state) => state.room);

  const availableCategories = useMemo(() => {
    if (!room) return [];
    return getCategoriesByMode(room.mode as RoomMode);
  }, [room?.mode]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customText, setCustomText] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [chaosMode, setChaosMode] = useState(false);
  const [shareWithCommunity, setShareWithCommunity] = useState(false);
  const [storedCustom, setStoredCustom] = useState<StoredCustomQuestion[]>([]);

  useEffect(() => {
    Promise.all([listStoredCustomQuestions(), fetchServerQuestions()])
      .then(([local, remote]) => {
        const byText = new Map<string, StoredCustomQuestion>();
        for (const item of [...remote, ...local]) {
          const key = normalizeCategoryText(item.text);
          if (!byText.has(key)) byText.set(key, item);
        }
        setStoredCustom(Array.from(byText.values()).sort((a, b) => b.createdAt - a.createdAt).slice(0, 140));
      })
      .catch(() => {
        setStoredCustom([]);
      });
  }, []);

  const customCategories = useMemo<Category[]>(
    () =>
      storedCustom.map((question) => ({
        id: question.id,
        text: question.text,
        mode: (room?.mode ?? "normal-chaos") as RoomMode,
        isCustom: true,
      })),
    [storedCustom, room?.mode],
  );

  const allCategories = useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of [...availableCategories, ...customCategories]) {
      if (!map.has(category.id)) map.set(category.id, category);
    }
    return Array.from(map.values());
  }, [availableCategories, customCategories]);

  const selectedCount = selected.size;
  const maxSelectable = allCategories.length;
  const canStart = selectedCount >= MIN_CATEGORIES;

  const toggleCategory = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const handleShuffle = () => {
    if (!room) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const allBuiltInForMode = getCategoriesByMode(room.mode as RoomMode);
    const builtInCount = Math.min(10, allBuiltInForMode.length);
    const builtIn = getRandomCategories(room.mode as RoomMode, builtInCount).map((category) => category.id);
    const custom = [...storedCustom]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.max(0, 10 - builtIn.length))
      .map((question) => question.id);
    setSelected(new Set([...builtIn, ...custom].slice(0, 10)));
  };

  const handleAddCustom = async () => {
    const result = await addStoredCustomQuestion(customText);
    if (!result.ok) {
      setCustomError(result.reason);
      return;
    }

    setStoredCustom((previous) => {
      if (previous.some((question) => question.id === result.question.id)) {
        return previous;
      }
      return [result.question, ...previous].slice(0, 120);
    });

    setSelected((previous) => new Set([...previous, result.question.id]));

    if (shareWithCommunity) {
      await saveQuestionToServer(result.question.text);
    }

    setCustomText("");
    setCustomError(null);
  };

  const handleStart = () => {
    const selectedIds = Array.from(selected);
    const selectedCustomCategories = storedCustom
      .filter((question) => selected.has(question.id))
      .map((question) => ({ id: question.id, text: normalizeCategoryText(question.text) }));

    wsClient.send({
      type: "START_GAME",
      payload: {
        selectedCategoryIds: selectedIds,
        customCategories: selectedCustomCategories,
        enableChaos: chaosMode,
      },
    });
  };

  useEffect(() => {
    if (room?.status === "voting") router.replace("/room/vote");
  }, [room?.status, router]);

  if (!room) return null;

  return (
    <Screen>
      <View style={{ paddingTop: spacing.lg }}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>

        <Text style={[typography.h1, { marginTop: spacing.lg }]}>Categories</Text>
        <Text style={[typography.caption, { marginTop: spacing.sm }]}>pick at least {MIN_CATEGORIES} for this game</Text>

        <View style={styles.controls}>
          <Text style={[typography.bodyBold, { color: canStart ? colors.primary : colors.textMuted, flex: 1 }]}> 
            {selectedCount}/{maxSelectable}
          </Text>
          <Pressable onPress={handleShuffle} style={styles.controlBtn}>
            <Text style={[typography.caption, { color: colors.primary }]}>Shuffle</Text>
          </Pressable>
          <Pressable onPress={() => setShowCustom((value) => !value)} style={styles.controlBtn}>
            <Text style={[typography.caption, { color: colors.warm }]}>{showCustom ? "Hide" : "Custom"}</Text>
          </Pressable>
          <Pressable onPress={() => setChaosMode((value) => !value)} style={styles.controlBtn}>
            <Text style={[typography.caption, { color: chaosMode ? colors.danger : colors.textMuted }]}>
              {chaosMode ? "Chaos On" : "Chaos Off"}
            </Text>
          </Pressable>
        </View>
      </View>

      {showCustom && (
        <View style={styles.customRow}>
          <View style={{ flex: 1 }}>
            <Input
              value={customText}
              onChangeText={(text: string) => {
                setCustomText(text);
                setCustomError(null);
              }}
              placeholder="most likely to..."
              maxLength={120}
            />
          </View>
          <Pressable onPress={handleAddCustom} style={styles.addBtn}>
            <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 14 }}>Add</Text>
          </Pressable>
        </View>
      )}

      {showCustom && (
        <Pressable onPress={() => setShareWithCommunity((value) => !value)} style={styles.shareOptInRow}>
          <View style={[styles.optInBox, shareWithCommunity && styles.optInBoxActive]} />
          <Text style={styles.shareOptInText}>Allow this question in future rooms (anonymous)</Text>
        </Pressable>
      )}

      {customError && <Text style={styles.errorText}>{customError}</Text>}

      {storedCustom.length > 0 && (
        <Text style={[typography.small, { marginBottom: spacing.sm }]}>your saved questions are available every room</Text>
      )}

      <FlatList
        data={allCategories}
        keyExtractor={(category) => category.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.huge }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ marginBottom: spacing.sm }}>
            <CategoryCard
              text={item.text}
              selected={selected.has(item.id)}
              onPress={() => toggleCategory(item.id)}
              haptic="selection"
            />
          </View>
        )}
      />

      <View style={{ paddingBottom: spacing.xxxl }}>
        <SoftButton
          title={canStart ? `Start Voting (${selectedCount})` : `Select ${Math.max(0, MIN_CATEGORIES - selectedCount)} more`}
          onPress={handleStart}
          disabled={!canStart}
          haptic="success"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { ...typography.caption, color: colors.textMuted },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  controlBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { ...typography.small, color: colors.danger, marginBottom: spacing.sm },
  shareOptInRow: {
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  shareOptInText: {
    ...typography.small,
    color: colors.textSecondary,
    flex: 1,
  },
  optInBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  optInBoxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
});
