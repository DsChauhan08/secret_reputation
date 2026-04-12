import { create } from "zustand";
import type {
  Room,
  Player,
  RoundResult,
  RoomMode,
  GameStatus,
  Category,
  ServerEvent,
} from "@secret-reputation/shared";
import { PLAYER_COLORS } from "./theme";

interface GameState {
  // Connection
  connected: boolean;
  connecting: boolean;
  error: string | null;

  // Identity
  playerId: string | null;
  playerName: string;
  playerColor: string;

  // Room
  room: Room | null;

  // Actions
  setConnection: (connected: boolean, connecting?: boolean) => void;
  setError: (error: string | null) => void;
  setIdentity: (id: string, name: string, color: string) => void;
  setPlayerName: (name: string) => void;
  setPlayerColor: (color: string) => void;
  setRoom: (room: Room | null) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updateVoteProgress: (submitted: number, required: number) => void;
  addResult: (result: RoundResult) => void;
  setGameStatus: (status: GameStatus) => void;
  setCurrentRound: (round: number) => void;
  reset: () => void;
}

const initialState = {
  connected: false,
  connecting: false,
  error: null,
  playerId: null,
  playerName: "",
  playerColor: PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)],
  room: null,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setConnection: (connected, connecting = false) =>
    set({ connected, connecting, error: connected ? null : get().error }),

  setError: (error) => set({ error }),

  setIdentity: (id, name, color) =>
    set({ playerId: id, playerName: name, playerColor: color }),

  setPlayerName: (name) => set({ playerName: name }),

  setPlayerColor: (color) => set({ playerColor: color }),

  setRoom: (room) => set({ room }),

  addPlayer: (player) =>
    set((state) => {
      if (!state.room) return state;
      const exists = state.room.players.some((p) => p.id === player.id);
      if (exists) return state;
      return {
        room: {
          ...state.room,
          players: [...state.room.players, player],
        },
      };
    }),

  removePlayer: (playerId) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          players: state.room.players.filter((p) => p.id !== playerId),
        },
      };
    }),

  updateVoteProgress: (submitted, required) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          votesSubmitted: submitted,
          votesRequired: required,
        },
      };
    }),

  addResult: (result) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          results: [...state.room.results, result],
        },
      };
    }),

  setGameStatus: (status) =>
    set((state) => {
      if (!state.room) return state;
      return { room: { ...state.room, status } };
    }),

  setCurrentRound: (round) =>
    set((state) => {
      if (!state.room) return state;
      return { room: { ...state.room, currentRound: round } };
    }),

  reset: () => set(initialState),
}));

// Handle server events — called by WebSocket client
export function handleServerEvent(event: ServerEvent) {
  const store = useGameStore.getState();

  switch (event.type) {
    case "ROOM_CREATED":
      store.setIdentity(
        event.payload.playerId,
        store.playerName,
        store.playerColor
      );
      store.setRoom(event.payload.room);
      break;

    case "ROOM_JOINED":
      store.setIdentity(
        event.payload.playerId,
        store.playerName,
        store.playerColor
      );
      store.setRoom(event.payload.room);
      break;

    case "PLAYER_JOINED":
      store.addPlayer(event.payload.player);
      break;

    case "PLAYER_LEFT":
      store.removePlayer(event.payload.playerId);
      break;

    case "GAME_STARTED":
      store.setRoom(event.payload.room);
      break;

    case "VOTE_RECEIVED":
      store.updateVoteProgress(
        event.payload.votesSubmitted,
        event.payload.votesRequired
      );
      break;

    case "REVEAL_RESULT":
      store.addResult(event.payload.result);
      store.setGameStatus("revealing");
      break;

    case "NEXT_ROUND":
      store.setCurrentRound(event.payload.currentRound);
      store.setGameStatus("voting");
      break;

    case "GAME_ENDED":
      store.setRoom({
        ...store.room!,
        results: event.payload.results,
        status: "ended",
      });
      break;

    case "ROOM_STATE":
      store.setRoom(event.payload.room);
      break;

    case "ERROR":
      store.setError(event.payload.message);
      break;
  }
}
