import type { ClientEvent, ServerEvent } from "@secret-reputation/shared";
import { handleServerEvent } from "./store";
import { useGameStore } from "./store";

// TODO: Replace with your Cloudflare Worker URL once deployed
const WS_BASE_URL = "wss://secret-reputation.YOUR_WORKER.workers.dev";

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private roomCode: string | null = null;

  connect(roomCode: string): Promise<void> {
    this.roomCode = roomCode;
    this.reconnectAttempts = 0;

    return new Promise((resolve, reject) => {
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

        this.ws.onmessage = (event) => {
          try {
            const serverEvent: ServerEvent = JSON.parse(event.data);
            handleServerEvent(serverEvent);
          } catch (err) {
            console.error("Failed to parse server event:", err);
          }
        };

        this.ws.onclose = (event) => {
          store.setConnection(false);
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
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

  send(event: ClientEvent) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn("WebSocket not connected, cannot send:", event.type);
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // prevent reconnect
    if (this.ws) {
      this.ws.close(1000, "Client disconnected");
      this.ws = null;
    }
    this.roomCode = null;
    useGameStore.getState().setConnection(false);
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    // Exponential backoff with jitter
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts) + Math.random() * 500,
      10000
    );

    this.reconnectTimer = setTimeout(() => {
      if (this.roomCode) {
        this.connect(this.roomCode).catch(() => {
          // Will retry via onclose
        });
      }
    }, delay);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton
export const wsClient = new WebSocketClient();
