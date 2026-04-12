import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import {
  Screen,
  GradientButton,
  Input,
  ModeCard,
  GlassCard,
} from "../src/components";
import { colors, gradients, typography, spacing, radii } from "../src/theme";
import { useGameStore } from "../src/store";
import { wsClient } from "../src/ws";
import type { RoomMode } from "@secret-reputation/shared";

const MODES: { key: RoomMode; title: string; desc: string; color: string }[] = [
  {
    key: "light-roast",
    title: "LIGHT ROAST",
    desc: "funny and harmless, nobody cries",
    color: "#F59E0B",
  },
  {
    key: "normal-chaos",
    title: "NORMAL CHAOS",
    desc: "sharp but survivable, the sweet spot",
    color: "#8B5CF6",
  },
  {
    key: "unhinged",
    title: "UNHINGED",
    desc: "full send, no safety net",
    color: "#F43F5E",
  },
];

export default function CreateRoomScreen() {
  const router = useRouter();
  const { playerName, playerColor } = useGameStore();
  const [roomName, setRoomName] = useState("");
  const [mode, setMode] = useState<RoomMode>("normal-chaos");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!playerName.trim()) {
      router.push("/join?needName=1&returnTo=create");
      return;
    }

    setLoading(true);
    try {
      wsClient.send({
        type: "CREATE_ROOM",
        payload: {
          playerName: playerName.trim(),
          playerColor,
          roomName: roomName.trim() || `Room ${Math.floor(Math.random() * 9000) + 1000}`,
          mode,
        },
      });
      // Navigation happens via store subscription in _layout or via ws event
    } catch {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>BACK</Text>
          </Pressable>
          <Text style={[typography.h1, styles.heading]}>
            CREATE ROOM
          </Text>
          <Text style={[typography.caption, { marginTop: spacing.sm }]}>
            pick a vibe and let the chaos begin
          </Text>
        </Animated.View>

        {/* Room Name */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={styles.label}>ROOM NAME</Text>
          <Input
            value={roomName}
            onChangeText={setRoomName}
            placeholder="optional, we'll make one up"
            maxLength={30}
          />
        </Animated.View>

        {/* Mode Selection */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <Text style={styles.label}>ROOM VIBE</Text>
          <View style={styles.modes}>
            {MODES.map((m) => (
              <ModeCard
                key={m.key}
                title={m.title}
                description={m.desc}
                selected={mode === m.key}
                onPress={() => setMode(m.key)}
                accentColor={m.color}
              />
            ))}
          </View>
        </Animated.View>

        {/* Info */}
        <Animated.View entering={FadeIn.duration(600).delay(500)}>
          <GlassCard style={styles.infoCard}>
            <Text style={[typography.small, { color: colors.textMuted, textAlign: "center" }]}>
              the mode controls which categories appear.{"\n"}
              unhinged unlocks everything. choose wisely.
            </Text>
          </GlassCard>
        </Animated.View>
      </ScrollView>

      {/* Create Button */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(600)}
        style={styles.footer}
      >
        <GradientButton
          title="CREATE ROOM"
          onPress={handleCreate}
          loading={loading}
          gradient={gradients.primary}
        />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: spacing.massive,
    paddingBottom: spacing.huge,
  },
  backBtn: {
    marginBottom: spacing.xxl,
  },
  backText: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 2,
  },
  heading: {
    letterSpacing: 4,
  },
  label: {
    ...typography.small,
    color: colors.textMuted,
    letterSpacing: 2,
    marginTop: spacing.xxxl,
    marginBottom: spacing.sm,
  },
  modes: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  infoCard: {
    marginTop: spacing.xxl,
  },
  footer: {
    paddingBottom: spacing.xxxl,
  },
});
