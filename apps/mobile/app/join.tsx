import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Screen, SoftButton, Input, ColorPicker } from "../src/components";
import { colors, typography, spacing } from "../src/theme";
import { useGameStore } from "../src/store";
import { wsClient } from "../src/ws";

export default function JoinRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ needName?: string; returnTo?: string }>();
  const { playerName, playerColor, setPlayerName, setPlayerColor } = useGameStore();

  const [code, setCode] = useState("");
  const [name, setName] = useState(playerName);
  const [selectedColor, setSelectedColor] = useState(playerColor);
  const [loading, setLoading] = useState(false);

  const isNameOnly = params.needName === "1";

  const handleJoin = async () => {
    if (!name.trim()) return;
    setPlayerName(name.trim());
    setPlayerColor(selectedColor);

    if (isNameOnly && params.returnTo === "create") {
      router.replace("/create");
      return;
    }

    if (!code.trim() || code.trim().length < 4) return;
    setLoading(true);
    try {
      await wsClient.connect(code.trim().toUpperCase());
      wsClient.send({
        type: "JOIN_ROOM",
        payload: { code: code.trim().toUpperCase(), playerName: name.trim(), playerColor: selectedColor },
      });
    } catch {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ paddingTop: spacing.massive }}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>Back</Text>
      </Pressable>

      <Text style={[typography.h1, { marginTop: spacing.xxl }]}>
        {isNameOnly ? "Who Are You" : "Join Room"}
      </Text>
      <Text style={[typography.caption, { marginTop: spacing.sm }]}>
        {isNameOnly ? "pick a name and color" : "enter the room code"}
      </Text>

      <View style={{ flex: 1, marginTop: spacing.lg }}>
        {!isNameOnly && (
          <>
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
          </>
        )}

        <Text style={styles.label}>YOUR NAME</Text>
        <Input value={name} onChangeText={setName} placeholder="what should we call you" maxLength={16} autoFocus={isNameOnly} />

        <Text style={styles.label}>YOUR COLOR</Text>
        <ColorPicker selected={selectedColor} onSelect={setSelectedColor} />

        <View style={styles.preview}>
          <View style={[styles.previewAvatar, { backgroundColor: selectedColor }]}>
            <Text style={styles.previewAvatarText}>{name ? name.charAt(0).toUpperCase() : "?"}</Text>
          </View>
          <Text style={[typography.body, { marginLeft: spacing.md }]}>{name || "unnamed"}</Text>
        </View>
      </View>

      <View style={{ paddingBottom: spacing.xxxl }}>
        <SoftButton
          title={isNameOnly ? "Continue" : "Join Room"}
          onPress={handleJoin}
          loading={loading}
          disabled={!name.trim() || (!isNameOnly && code.trim().length < 4)}
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
