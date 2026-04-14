import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Screen, SoftButton, Input, ColorPicker } from "../src/components";
import { colors, typography, spacing } from "../src/theme";
import { useGameStore } from "../src/store";
import { wsClient } from "../src/ws";

export default function JoinRoomScreen() {
  const router = useRouter();
  const { playerName, playerColor, setPlayerName, setPlayerColor } = useGameStore();

  const [code, setCode] = useState("");
  const [name, setName] = useState(playerName);
  const [selectedColor, setSelectedColor] = useState(playerColor);
  const [loading, setLoading] = useState(false);

  const canJoin = name.trim().length >= 1 && code.trim().length >= 4;

  const handleJoin = async () => {
    if (!canJoin) return;

    setPlayerName(name.trim());
    setPlayerColor(selectedColor);

    setLoading(true);
    try {
      await wsClient.connect(code.trim().toUpperCase());
      wsClient.send({
        type: "JOIN_ROOM",
        payload: {
          code: code.trim().toUpperCase(),
          playerName: name.trim(),
          playerColor: selectedColor,
        },
      });
      router.replace("/room/lobby");
    } catch {
      setLoading(false);
      Alert.alert("Connection Failed", "Could not join the room. Check the code and try again.");
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

        <Text style={[typography.h1, { marginTop: spacing.xxl }]}>Join Room</Text>
        <Text style={[typography.caption, { marginTop: spacing.sm }]}>
          enter the room code to join
        </Text>

        <Text style={styles.label}>ROOM CODE</Text>
        <Input
          value={code}
          onChangeText={(t: string) => setCode(t.toUpperCase())}
          placeholder="ENTER CODE"
          maxLength={6}
          autoCapitalize="characters"
          autoFocus
          textStyle={styles.codeInput}
        />

        <Text style={styles.label}>YOUR NAME</Text>
        <Input value={name} onChangeText={setName} placeholder="what should we call you" maxLength={16} />

        <Text style={styles.label}>YOUR COLOR</Text>
        <ColorPicker selected={selectedColor} onSelect={setSelectedColor} />

        <View style={styles.preview}>
          <View style={[styles.previewAvatar, { backgroundColor: selectedColor }]}>
            <Text style={styles.previewAvatarText}>{name ? name.charAt(0).toUpperCase() : "?"}</Text>
          </View>
          <Text style={[typography.body, { marginLeft: spacing.md }]}>{name || "unnamed"}</Text>
        </View>
      </ScrollView>

      <View style={{ paddingBottom: spacing.xxxl }}>
        <SoftButton
          title="Join Room"
          onPress={handleJoin}
          loading={loading}
          disabled={!canJoin}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { ...typography.caption, color: colors.textMuted },
  label: { ...typography.small, color: colors.textMuted, letterSpacing: 1.5, marginTop: spacing.xxl, marginBottom: spacing.sm },
  codeInput: { fontSize: 24, fontWeight: "700", letterSpacing: 8, textAlign: "center" },
  preview: { flexDirection: "row", alignItems: "center", marginTop: spacing.xxl, alignSelf: "center" },
  previewAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  previewAvatarText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
});
