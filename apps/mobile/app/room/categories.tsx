import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Screen, SoftButton, CategoryCard, Card, Input } from "../../src/components";
import { colors, typography, spacing, radii } from "../../src/theme";
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
    return getCategoriesByMode(room.mode as RoomMode);
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
    if (next.has(id)) { next.delete(id); } else { if (next.size >= MAX_CATEGORIES) return; next.add(id); }
    setSelected(next);
  };

  const handleShuffle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const shuffled = [...allCategories].sort(() => Math.random() - 0.5);
    setSelected(new Set(shuffled.slice(0, 8).map((c) => c.id)));
  };

  const handleAddCustom = () => {
    const text = customText.trim();
    if (!text) return;
    const check = isContentSafe(text);
    if (!check.safe) { setCustomError(check.reason ?? "not allowed"); return; }
    const cat: Category = { id: `custom_${Date.now()}`, text: text.toLowerCase(), mode: (room?.mode ?? "normal-chaos") as RoomMode, isCustom: true };
    setCustomCategories((prev) => [...prev, cat]);
    setSelected((prev) => new Set([...prev, cat.id]));
    setCustomText("");
    setCustomError(null);
  };

  const handleStart = () => {
    wsClient.send({ type: "START_GAME", payload: { selectedCategoryIds: Array.from(selected) } });
    router.replace("/room/vote");
  };

  if (!room) return null;

  return (
    <Screen>
      <View style={{ paddingTop: spacing.lg }}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>Back</Text></Pressable>
        <Text style={[typography.h1, { marginTop: spacing.lg }]}>Categories</Text>
        <Text style={[typography.caption, { marginTop: spacing.sm }]}>pick {MIN_CATEGORIES}-{MAX_CATEGORIES} for this round</Text>

        <View style={styles.controls}>
          <Text style={[typography.bodyBold, { color: canStart ? colors.primary : colors.textMuted, flex: 1 }]}>
            {selectedCount}/{MAX_CATEGORIES}
          </Text>
          <Pressable onPress={handleShuffle} style={styles.controlBtn}><Text style={[typography.caption, { color: colors.primary }]}>Shuffle</Text></Pressable>
          <Pressable onPress={() => setShowCustom(!showCustom)} style={styles.controlBtn}><Text style={[typography.caption, { color: colors.warm }]}>{showCustom ? "Hide" : "Custom"}</Text></Pressable>
        </View>
      </View>

      {showCustom && (
        <View style={styles.customRow}>
          <View style={{ flex: 1 }}><Input value={customText} onChangeText={(t: string) => { setCustomText(t); setCustomError(null); }} placeholder="most likely to..." maxLength={120} /></View>
          <Pressable onPress={handleAddCustom} style={styles.addBtn}><Text style={{ color: "#FFF", fontWeight: "600", fontSize: 14 }}>Add</Text></Pressable>
        </View>
      )}
      {customError && <Text style={styles.errorText}>{customError}</Text>}

      <FlatList
        data={allCategories}
        keyExtractor={(c) => c.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.huge }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ marginBottom: spacing.sm }}>
            <CategoryCard text={item.text} selected={selected.has(item.id)} onPress={() => toggleCategory(item.id)} />
          </View>
        )}
      />

      <View style={{ paddingBottom: spacing.xxxl }}>
        <SoftButton
          title={canStart ? `Start Voting (${selectedCount})` : `Select ${MIN_CATEGORIES - selectedCount} more`}
          onPress={handleStart}
          disabled={!canStart}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { ...typography.caption, color: colors.textMuted },
  controls: { flexDirection: "row", alignItems: "center", gap: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.lg },
  controlBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.cardBorder },
  customRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md, alignItems: "center" },
  addBtn: { backgroundColor: colors.primary, borderRadius: radii.md, paddingHorizontal: spacing.lg, height: 50, alignItems: "center", justifyContent: "center" },
  errorText: { ...typography.small, color: colors.danger, marginBottom: spacing.sm },
});
