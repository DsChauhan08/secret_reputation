import Constants from "expo-constants";
import { handleServerEvent, useGameStore } from "./store";
import type { RoomMode, ServerEvent } from "./store";
import type { CustomCategoryInput } from "@secret-reputation/shared";

type AllowedOutboundEvent =
  | { type: "CREATE_ROOM"; payload: { playerName: string; playerColor: string; roomName: string; mode: RoomMode } }
  | { type: "JOIN_ROOM"; payload: { code: string; playerName: string; playerColor: string } }
  | { type: "RECONNECT"; payload: { playerId: string; reconnectToken: string } }
  | { type: "START_GAME"; payload: { selectedCategoryIds: string[]; customCategories?: CustomCategoryInput[] } }
  | { type: "SUBMIT_VOTE"; payload: { categoryId: string; votedForId: string } }
  | { type: "NEXT_ROUND"; payload: Record<string, never> }
  | { type: "PLAY_AGAIN"; payload: Record<string, never> }
  | { type: "KICK_PLAYER"; payload: { playerId: string } };

function getConfiguredWsUrl(): string {
 
  const fromEnv = (Constants.expoConfig?.extra as Record<string, string> | undefined)?.wsUrl;
  if (fromEnv && fromEnv.startsWith("wss://")) return fromEnv;
  if (fromEnv && fromEnv.startsWith("ws://")) return fromEnv;

 
  return "ws://localhost:8787";
}

function toHttpUrl(wsUrl: string): string {
  if (wsUrl.startsWith("wss://")) return wsUrl.replace("wss://", "https://");
  if (wsUrl.startsWith("ws://")) return wsUrl.replace("ws://", "http://");
  return wsUrl;
}

export function getBackendBaseUrls(): { wsBaseUrl: string; httpBaseUrl: string } {
  const wsBaseUrl = getConfiguredWsUrl();
  return {
    wsBaseUrl,
    httpBaseUrl: toHttpUrl(wsBaseUrl),
  };
}

const { wsBaseUrl: WS_BASE_URL } = getBackendBaseUrls();
const CONNECTION_TIMEOUT_MS = 10000;

function sanitizeString(str: string, maxLen: number = 100): string {
  return str.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLen);
}

function sanitizeRoomCode(roomCode: string): string {
  return roomCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

function sanitizePayload(value: unknown, depth: number = 0): unknown {
  if (depth > 5) return undefined;
  if (typeof value === "string") return sanitizeString(value, 240);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;

  if (Array.isArray(value)) {
    return value
      .slice(0, 64)
      .map((item) => sanitizePayload(item, depth + 1))
      .filter((item) => item !== undefined);
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(obj)) {
      const safeKey = sanitizeString(key, 48);
      if (!safeKey) continue;
      const safeValue = sanitizePayload(entry, depth + 1);
      if (safeValue !== undefined) {
        sanitized[safeKey] = safeValue;
      }
    }
    return sanitized;
  }

  return undefined;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private roomCode: string | null = null;

  private sendReconnectIfPossible(): void {
    const store = useGameStore.getState();
    if (!store.playerId || !store.reconnectToken || !this.roomCode) return;

    const roomCodeMatches = store.room?.code?.toUpperCase() === this.roomCode;
    if (!roomCodeMatches) return;

    this.send({
      type: "RECONNECT",
      payload: { playerId: store.playerId, reconnectToken: sanitizeString(store.reconnectToken, 128) },
    });
  }

  connect(roomCode: string, isReconnect = false): Promise<void> {
    const sanitizedCode = sanitizeRoomCode(roomCode);
    if (!/^[A-Z0-9]{4,6}$/.test(sanitizedCode)) {
      return Promise.reject(new Error("Invalid room code format"));
    }

    this.roomCode = sanitizedCode;
    if (!isReconnect) {
      this.reconnectAttempts = 0;

      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        this.ws.close(1000, "Switching room");
      }

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    }

    return new Promise<void>((resolve, reject) => {
      try {
        const store = useGameStore.getState();
        store.setConnection(false, true);

        const url = `${WS_BASE_URL}/api/rooms/${sanitizedCode}/ws`;
        this.ws = new WebSocket(url);

       
        const timeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            this.ws.close();
            store.setConnection(false);
            store.setError("Connection timed out");
            reject(new Error("Connection timed out"));
          }
        }, CONNECTION_TIMEOUT_MS);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.reconnectAttempts = 0;
          this.reconnectTimer = null;
          store.setConnection(true);
          if (isReconnect && store.playerId && store.reconnectToken) {
            this.sendReconnectIfPossible();
          }
          resolve();
        };

        this.ws.onmessage = (event: WebSocketMessageEvent) => {
          try {
            const serverEvent: ServerEvent = JSON.parse(event.data as string);
            handleServerEvent(serverEvent);
          } catch {
           
          }
        };

        this.ws.onclose = () => {
          clearTimeout(timeout);
          store.setConnection(false);
          const activeRoomCode = useGameStore.getState().room?.code?.toUpperCase();
          const shouldReconnect = this.roomCode && activeRoomCode === this.roomCode;
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            if (shouldReconnect) {
              this.scheduleReconnect();
            }
          }
        };

        this.ws.onerror = () => {
          clearTimeout(timeout);
          store.setConnection(false);
          store.setError("Connection failed");
          reject(new Error("WebSocket connection failed"));
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  send(event: AllowedOutboundEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const sanitizedPayload = sanitizePayload(event.payload);
    this.ws.send(
      JSON.stringify({
        type: event.type,
        payload: sanitizedPayload ?? {},
      }),
    );
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.ws) {
      this.ws.close(1000, "Client disconnected");
      this.ws = null;
    }
    this.roomCode = null;
    useGameStore.getState().setConnection(false);
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts) + Math.random() * 500,
      10000
    );
    this.reconnectTimer = setTimeout(() => {
      if (this.roomCode) {
        this.connect(this.roomCode, true).catch(() => {});
      }
    }, delay);
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WebSocketClient();
