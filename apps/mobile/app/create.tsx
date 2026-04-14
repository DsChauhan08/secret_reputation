import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Screen, SoftButton, Input, ModeCard, Card } from "../src/components";
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
      // Generate a temporary room code to connect
      const tempCode = Array.from({ length: 6 }, () =>
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)]
      ).join("");

      await wsClient.connect(tempCode);
      wsClient.send({
        type: "CREATE_ROOM",
        payload: {
          playerName: playerName.trim(),
          playerColor,
          roomName: roomName.trim() || `Room ${Math.floor(Math.random() * 9000) + 1000}`,
          mode,
        },
      });
      // Navigation happens when ROOM_CREATED event arrives via store
      router.replace("/room/lobby");
    } catch (err) {
      setLoading(false);
      Alert.alert("Connection Failed", "Could not reach the server. Make sure the backend is running.");
    }
  };

  return (
    <Screen>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing.huge }} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>

        <Text style={[typography.h1, { marginTop: spacing.xxl }]}>Create Room</Text>
        <Text style={[typography.caption, { marginTop: spacing.sm }]}>
          pick a vibe and let the chaos begin
        </Text>

        <Text style={styles.label}>ROOM NAME</Text>
        <Input value={roomName} onChangeText={setRoomName} placeholder="optional, we'll make one up" maxLength={30} />

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
        <SoftButton title="Create Room" onPress={handleCreate} loading={loading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { ...typography.caption, color: colors.textMuted },
  label: { ...typography.small, color: colors.textMuted, letterSpacing: 1.5, marginTop: spacing.xxl, marginBottom: spacing.sm },
  modes: { flexDirection: "row", gap: spacing.sm },
});
