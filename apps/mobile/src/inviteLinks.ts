import { Linking } from "react-native";
import { getBackendBaseUrls } from "./ws";

const GITHUB_RELEASES_LATEST = "https://github.com/DsChauhan08/secret_reputation/releases/latest";

function sanitizeRoomCode(roomCode: string): string {
  const safe = roomCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return /^[A-Z0-9]{4,6}$/.test(safe) ? safe : "";
}

function getInviteUrl(roomCode: string): string {
  const safeCode = sanitizeRoomCode(roomCode);
  const { httpBaseUrl } = getBackendBaseUrls();

  if (!safeCode) {
    return GITHUB_RELEASES_LATEST;
  }

  return `${httpBaseUrl}/invite?room=${safeCode}`;
}

export function getGithubReleaseUrl(): string {
  return GITHUB_RELEASES_LATEST;
}

export function buildShareMessage(roomCode: string): string {
  const safeCode = sanitizeRoomCode(roomCode);
  const inviteUrl = getInviteUrl(safeCode);
  return [
    "You got mentioned in Secret Reputation 👀",
    safeCode ? `Room code: ${safeCode}` : null,
    `Join: ${inviteUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function getRoomInviteUrl(roomCode: string): string {
  return getInviteUrl(roomCode);
}

export async function openRoomInvite(roomCode: string): Promise<void> {
  const safeCode = sanitizeRoomCode(roomCode);
  if (safeCode) {
    const appUrl = `secretrep://join?room=${safeCode}`;
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
      return;
    }
  }

  await Linking.openURL(getInviteUrl(roomCode));
}
