import { handleServerEvent, useGameStore } from "./store";
import type { ServerEvent } from "./store";

// Inline ClientEvent type to avoid cross-module resolution issues
type ClientEvent =
  | { type: "CREATE_ROOM"; payload: { playerName: string; playerColor: string; roomName: string; mode: string } }
  | { type: "JOIN_ROOM"; payload: { code: string; playerName: string; playerColor: string } }
  | { type: "START_GAME"; payload: { selectedCategoryIds: string[] } }
  | { type: "SUBMIT_VOTE"; payload: { categoryId: string; votedForId: string } }
  | { type: "NEXT_ROUND"; payload: Record<string, never> }
  | { type: "PLAY_AGAIN"; payload: Record<string, never> }
  | { type: "KICK_PLAYER"; payload: { playerId: string } };

// TODO: Replace with your Cloudflare Worker URL once deployed
const WS_BASE_URL = "wss://secret-reputation.YOUR_WORKER.workers.dev";

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private roomCode: string | null = null;

  connect(roomCode: string): Promise<void> {
    this.roomCode = roomCode;
    this.reconnectAttempts = 0;

    return new Promise<void>((resolve, reject) => {
      try {
        const store = useGameStore.getState();
        store.setConnection(false, true);

        const url = `${WS_BASE_URL}/api/rooms/${roomCode}/ws`;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          store.setConnection(true);
          resolve();
        };

        this.ws.onmessage = (event: WebSocketMessageEvent) => {
          try {
            const serverEvent: ServerEvent = JSON.parse(event.data as string);
            handleServerEvent(serverEvent);
          } catch (err) {
            console.error("Failed to parse server event:", err);
          }
        };

        this.ws.onclose = () => {
          store.setConnection(false);
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = () => {
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn("WebSocket not connected, cannot send:", event.type);
    }
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
