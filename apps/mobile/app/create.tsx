import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Screen, SoftButton, Input, ModeCard, Card, ColorPicker } from "../src/components";
import { colors, typography, spacing } from "../src/theme";
import { useGameStore } from "../src/store";
import { wsClient } from "../src/ws";
import type { RoomMode } from "../src/store";

const MODES: { key: RoomMode; title: string; desc: string; color: string }[] = [
  { key: "light-roast", title: "Light Roast", desc: "funny and harmless", color: "#845EC2" },
  { key: "normal-chaos", title: "Normal Chaos", desc: "sharp but survivable", color: "#4B4453" },
  { key: "unhinged", title: "Unhinged", desc: "full send, no safety net", color: "#C34A36" },
];

export default function CreateRoomScreen() {
  const router = useRouter();
  const { playerName, playerColor, setPlayerName, setPlayerColor } = useGameStore();

  const [name, setName] = useState(playerName);
  const [selectedColor, setSelectedColor] = useState(playerColor);
  const [roomName, setRoomName] = useState("");
  const [mode, setMode] = useState<RoomMode>("normal-chaos");
  const [loading, setLoading] = useState(false);

  const canCreate = name.trim().length >= 1;

  const handleCreate = async () => {
    if (!canCreate) return;

    // Save identity to store
    setPlayerName(name.trim());
    setPlayerColor(selectedColor);

    setLoading(true);
    try {
      const tempCode = Array.from({ length: 6 }, () =>
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)]
      ).join("");

      await wsClient.connect(tempCode);
      wsClient.send({
        type: "CREATE_ROOM",
        payload: {
          playerName: name.trim(),
          playerColor: selectedColor,
          roomName: roomName.trim() || `Room ${Math.floor(Math.random() * 9000) + 1000}`,
          mode,
        },
      });
      router.replace("/room/lobby");
    } catch {
      setLoading(false);
      Alert.alert("Connection Failed", "Could not reach the server. Make sure the backend is running.");
    }
  };

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing.huge }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>

        <Text style={[typography.h1, { marginTop: spacing.xxl }]}>Create Room</Text>
        <Text style={[typography.caption, { marginTop: spacing.sm }]}>
          set up your identity and pick a vibe
        </Text>

        {/* Identity */}
        <Text style={styles.label}>YOUR NAME</Text>
        <Input
          value={name}
          onChangeText={setName}
          placeholder="what should we call you"
          maxLength={16}
          autoFocus={!playerName}
        />

        <Text style={styles.label}>YOUR COLOR</Text>
        <ColorPicker selected={selectedColor} onSelect={setSelectedColor} />

        {/* Room settings */}
        <Text style={styles.label}>ROOM NAME</Text>
        <Input
          value={roomName}
          onChangeText={setRoomName}
          placeholder="optional, we'll make one up"
          maxLength={30}
        />

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

        <Card style={{ marginTop: spacing.xxl }}>
          <Text style={[typography.small, { color: colors.textMuted, textAlign: "center" }]}>
            the mode controls which categories appear.{"\n"}
            unhinged unlocks everything.
          </Text>
        </Card>
      </ScrollView>

      <View style={{ paddingBottom: spacing.xxxl }}>
        <SoftButton
          title="Create Room"
          onPress={handleCreate}
          loading={loading}
          disabled={!canCreate}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { ...typography.caption, color: colors.textMuted },
  label: {
    ...typography.small,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  modes: { flexDirection: "row", gap: spacing.sm },
});
