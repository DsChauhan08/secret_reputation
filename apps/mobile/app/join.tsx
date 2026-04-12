import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Screen,
  GradientButton,
  Input,
  ColorPicker,
} from "../src/components";
import { colors, gradients, typography, spacing } from "../src/theme";
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
        payload: {
          code: code.trim().toUpperCase(),
          playerName: name.trim(),
          playerColor: selectedColor,
        },
      });
    } catch {
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>BACK</Text>
        </Pressable>
        <Text style={[typography.h1, styles.heading]}>
          {isNameOnly ? "WHO ARE YOU" : "JOIN ROOM"}
        </Text>
        <Text style={[typography.caption, { marginTop: spacing.sm }]}>
          {isNameOnly
            ? "pick a name and color before creating"
            : "enter the room code and pick a name"}
        </Text>
      </Animated.View>

      <View style={styles.form}>
        {/* Room Code */}
        {!isNameOnly && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <Text style={styles.label}>ROOM CODE</Text>
            <Input
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              placeholder="ENTER CODE"
              maxLength={6}
              autoCapitalize="characters"
              autoFocus
              textStyle={styles.codeInput}
            />
          </Animated.View>
        )}

        {/* Nickname */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <Text style={styles.label}>YOUR NAME</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="what should we call you"
            maxLength={16}
            autoFocus={isNameOnly}
          />
        </Animated.View>

        {/* Color Picker */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)}>
          <Text style={styles.label}>YOUR COLOR</Text>
          <ColorPicker
            selected={selectedColor}
            onSelect={setSelectedColor}
          />
        </Animated.View>

        {/* Preview */}
        <Animated.View entering={FadeInDown.duration(400).delay(500)}>
          <View style={styles.preview}>
            <View
              style={[
                styles.previewAvatar,
                { backgroundColor: selectedColor },
              ]}
            >
              <Text style={styles.previewAvatarText}>
                {name ? name.charAt(0).toUpperCase() : "?"}
              </Text>
            </View>
            <Text style={[typography.body, { marginLeft: spacing.md }]}>
              {name || "unnamed"}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Join Button */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(600)}
        style={styles.footer}
      >
        <GradientButton
          title={isNameOnly ? "CONTINUE" : "JOIN ROOM"}
          onPress={handleJoin}
          loading={loading}
          disabled={!name.trim() || (!isNameOnly && code.trim().length < 4)}
          gradient={gradients.primary}
        />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.massive,
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
  form: {
    flex: 1,
    marginTop: spacing.lg,
  },
  label: {
    ...typography.small,
    color: colors.textMuted,
    letterSpacing: 2,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 8,
    textAlign: "center",
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xxl,
    alignSelf: "center",
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  previewAvatarText: {
    color: "#0B0B0F",
    fontSize: 20,
    fontWeight: "800",
  },
  footer: {
    paddingBottom: spacing.xxxl,
  },
});
