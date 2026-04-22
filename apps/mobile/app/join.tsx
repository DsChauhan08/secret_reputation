import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen, SoftButton, Input, ColorPicker } from "../src/components";
import { colors, typography, spacing } from "../src/theme";
import { useGameStore } from "../src/store";
import { wsClient } from "../src/ws";
import { trackError, trackEvent } from "../src/analytics";

export default function JoinRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ room?: string | string[] }>();
  const roomStatus = useGameStore((state) => state.room?.status);
  const serverError = useGameStore((state) => state.error);
  const { playerName, playerColor, setPlayerName, setPlayerColor, setRoom, setError } = useGameStore();

  const deepLinkedCode = Array.isArray(params.room) ? params.room[0] : params.room;

  const [code, setCode] = useState((deepLinkedCode ?? "").toUpperCase().slice(0, 6));
  const [name, setName] = useState(playerName);
  const [selectedColor, setSelectedColor] = useState(playerColor);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deepLinkedCode) return;
    setCode(deepLinkedCode.toUpperCase().slice(0, 6));
  }, [deepLinkedCode]);

  const canJoin = name.trim().length >= 1 && code.trim().length >= 4;

  const handleJoin = async () => {
    if (!canJoin) return;

    setPlayerName(name.trim());
    setPlayerColor(selectedColor);
    setRoom(null);
    setError(null);

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

      trackEvent("room_join_requested", {
        room_code_length: code.trim().length,
      });
    } catch {
      setLoading(false);
      trackError(new Error("join_room_connection_failed"), {
        room_code_length: code.trim().length,
      });
      Alert.alert("Connection Failed", "Could not join the room. Check the code and try again.");
    }
  };

  useEffect(() => {
    if (loading && roomStatus === "lobby") {
      router.replace("/room/lobby");
    }
  }, [loading, roomStatus, router]);

  useEffect(() => {
    if (!loading || !serverError) return;
    setLoading(false);
    Alert.alert("Could not join room", serverError);
    setError(null);
  }, [loading, serverError, setError]);

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
        <Input value={name} onChangeText={setName} placeholder="what should we call you" maxLength={20} />

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
