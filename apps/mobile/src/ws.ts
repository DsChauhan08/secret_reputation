import Constants from "expo-constants";
import { handleServerEvent, useGameStore } from "./store";
import type { ServerEvent } from "./store";

type ClientEvent =
  | { type: "CREATE_ROOM"; payload: { playerName: string; playerColor: string; roomName: string; mode: string } }
  | { type: "JOIN_ROOM"; payload: { code: string; playerName: string; playerColor: string } }
  | { type: "START_GAME"; payload: { selectedCategoryIds: string[] } }
  | { type: "SUBMIT_VOTE"; payload: { categoryId: string; votedForId: string } }
  | { type: "NEXT_ROUND"; payload: Record<string, never> }
  | { type: "PLAY_AGAIN"; payload: Record<string, never> }
  | { type: "KICK_PLAYER"; payload: { playerId: string } };

function getWsUrl(): string {
  // Read from expo config (set via EXPO_PUBLIC_WS_URL env var)
  const fromEnv = (Constants.expoConfig?.extra as Record<string, string> | undefined)?.wsUrl;
  if (fromEnv && fromEnv.startsWith("wss://")) return fromEnv;
  if (fromEnv && fromEnv.startsWith("ws://")) return fromEnv;

  // Fallback for local dev — override this when deploying
  return "ws://localhost:8787";
}

const WS_BASE_URL = getWsUrl();
const CONNECTION_TIMEOUT_MS = 10000;

function sanitizeString(str: string, maxLen: number = 100): string {
  return str.replace(/[<>"'&]/g, "").trim().slice(0, maxLen);
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private roomCode: string | null = null;

  connect(roomCode: string): Promise<void> {
    const sanitizedCode = sanitizeString(roomCode, 6).toUpperCase();
    if (!/^[A-Z0-9]{4,6}$/.test(sanitizedCode)) {
      return Promise.reject(new Error("Invalid room code format"));
    }

    this.roomCode = sanitizedCode;
    this.reconnectAttempts = 0;

    return new Promise<void>((resolve, reject) => {
      try {
        const store = useGameStore.getState();
        store.setConnection(false, true);

        const url = `${WS_BASE_URL}/api/rooms/${sanitizedCode}/ws`;
        this.ws = new WebSocket(url);

        // Connection timeout
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
          store.setConnection(true);
          resolve();
        };

        this.ws.onmessage = (event: WebSocketMessageEvent) => {
          try {
            const serverEvent: ServerEvent = JSON.parse(event.data as string);
            handleServerEvent(serverEvent);
          } catch {
            // Silently ignore malformed messages
          }
        };

        this.ws.onclose = () => {
          clearTimeout(timeout);
          store.setConnection(false);
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
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

  send(event: ClientEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Sanitize string fields in payload
    const sanitized = { ...event };
    if ("payload" in sanitized && typeof sanitized.payload === "object") {
      const p = { ...sanitized.payload } as Record<string, unknown>;
      for (const key of Object.keys(p)) {
        if (typeof p[key] === "string") {
          p[key] = sanitizeString(p[key] as string);
        }
      }
      sanitized.payload = p as typeof event.payload;
    }

    this.ws.send(JSON.stringify(sanitized));
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
        this.connect(this.roomCode).catch(() => {});
      }
    }, delay);
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WebSocketClient();
